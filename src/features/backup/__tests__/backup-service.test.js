import { getDatabase } from '@/database/database';
import { LATEST_SCHEMA_VERSION, runMigrations } from '@/database/migrations';
import { loadProgression } from '@/features/progression/progression-service';
import { completeQuest, createQuest, loadQuestBoardData, undoQuestCompletion } from '@/features/quests/quest-service';
import { loadRewardOverview } from '@/features/rewards/reward-service';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { BACKUP_TABLES, getBackupFileName } from '../backup-format';
import { createBackup, inspectBackup, restoreBackup } from '../backup-service';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));

const databases = [];
async function useFreshDatabase() {
  const db = createTestDatabase();
  databases.push(db);
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
  return db;
}
afterEach(() => {
  while (databases.length) databases.pop().close();
});

const WED = new Date(2026, 10, 25, 12);
const input = { title: 'Lift', category: 'fitness', difficulty: 'hard', cadence: 'daily', attributeWeights: { strength: 2, vitality: 1 } };

async function seedActivity() {
  const quest = await createQuest(input, new Date(2026, 10, 20));
  for (const day of [21, 22, 23, 24]) await completeQuest(quest.id, new Date(2026, 10, day, 9));
  const undone = await completeQuest(quest.id, WED);
  await undoQuestCompletion(undone.completion.id, WED);
  await loadRewardOverview(WED);
  return quest;
}

async function snapshotTables(db) {
  const snapshot = {};
  for (const table of BACKUP_TABLES) snapshot[table] = await db.getAllAsync(`SELECT * FROM ${table} ORDER BY 1`);
  return snapshot;
}

test('a backup round-trips every table exactly, into a fresh install', async () => {
  const original = await useFreshDatabase();
  await seedActivity();
  const before = await snapshotTables(original);
  const backupText = JSON.stringify(await createBackup(WED));

  const fresh = await useFreshDatabase();
  const backup = inspectBackup(backupText);
  const counts = await restoreBackup(backup);

  expect(await snapshotTables(fresh)).toEqual(before);
  expect(counts.quest_completions).toBe(5);
  expect((await loadProgression()).repaired).toBe(false);
});

test('backup carries metadata and a summary', async () => {
  await useFreshDatabase();
  await seedActivity();
  const backup = await createBackup(WED);
  expect(backup).toMatchObject({ app: 'system-shadow', kind: 'backup', formatVersion: 1, schemaVersion: LATEST_SCHEMA_VERSION, exportedAt: WED.toISOString() });
  expect(backup.summary).toMatchObject({ quests: expect.any(Number), completions: 4 });
  expect(getBackupFileName(new Date(2026, 10, 25, 21, 5))).toBe('system-shadow-backup-2026-11-25-2105.json');
});

test('after a restore, XP integrity holds: completed quests stay completed and cannot pay twice', async () => {
  await useFreshDatabase();
  const quest = await seedActivity();
  await completeQuest(quest.id, WED); // redo today's completion
  const backup = await createBackup(WED);

  await useFreshDatabase();
  await restoreBackup(inspectBackup(JSON.stringify(backup)));

  expect((await completeQuest(quest.id, WED)).status).toBe('already-completed');
  const { quests, activeCompletions } = await loadQuestBoardData(WED);
  expect(quests.find((candidate) => candidate.id === quest.id)).toBeDefined();
  expect(activeCompletions.some((completion) => completion.questId === quest.id)).toBe(true);
  // Rewards reconcile to the same set: nothing new granted or revoked.
  expect((await loadRewardOverview(WED)).reconciliation.events).toEqual([]);
});

test('restoring replaces current data rather than merging', async () => {
  await useFreshDatabase();
  const backup = await createBackup(WED); // empty profile

  await seedActivity();
  await restoreBackup(inspectBackup(JSON.stringify(backup)));
  const db = await getDatabase();
  expect((await db.getFirstAsync('SELECT COUNT(*) AS n FROM quest_completions')).n).toBe(0);
  expect((await loadProgression()).state.totalXp).toBe(0);
});

describe('rejects bad files without touching current data', () => {
  let db;
  let goodBackup;
  let before;

  beforeEach(async () => {
    db = await useFreshDatabase();
    await seedActivity();
    goodBackup = await createBackup(WED);
    before = await snapshotTables(db);
  });

  test.each([
    ['empty file', '', 'EMPTY'],
    ['not JSON', '{oops', 'NOT_JSON'],
    ['some other JSON', JSON.stringify({ hello: 'world' }), 'NOT_A_BACKUP'],
  ])('%s', (_label, text, code) => {
    expect(() => inspectBackup(text)).toThrow(expect.objectContaining({ code }));
  });

  test('backups from a newer or older app version', () => {
    expect(() => inspectBackup(JSON.stringify({ ...goodBackup, schemaVersion: LATEST_SCHEMA_VERSION + 1 }))).toThrow(
      expect.objectContaining({ code: 'NEWER_BACKUP' }),
    );
    expect(() => inspectBackup(JSON.stringify({ ...goodBackup, schemaVersion: LATEST_SCHEMA_VERSION - 1 }))).toThrow(
      expect.objectContaining({ code: 'OLDER_BACKUP' }),
    );
  });

  test('missing tables or player profile', () => {
    const { quests: _dropped, ...tables } = goodBackup.tables;
    expect(() => inspectBackup(JSON.stringify({ ...goodBackup, tables }))).toThrow(expect.objectContaining({ code: 'INVALID' }));
    expect(() => inspectBackup(JSON.stringify({ ...goodBackup, tables: { ...goodBackup.tables, player: [] } }))).toThrow(
      expect.objectContaining({ code: 'INVALID' }),
    );
  });

  test('unknown columns are rejected and nothing changes', async () => {
    const tampered = structuredClone(goodBackup);
    tampered.tables.quests[0].hacked = 1;
    await expect(restoreBackup(tampered)).rejects.toMatchObject({ code: 'INVALID' });
    expect(await snapshotTables(db)).toEqual(before);
  });

  test('broken references (a completion pointing at a missing XP award) roll back', async () => {
    const tampered = structuredClone(goodBackup);
    tampered.tables.xp_transactions = tampered.tables.xp_transactions.filter((row) => !row.id.startsWith('quest:'));
    tampered.tables.xp_transaction_attributes = tampered.tables.xp_transaction_attributes.filter((row) => !row.transaction_id.startsWith('quest:'));
    await expect(restoreBackup(inspectBackup(JSON.stringify(tampered)))).rejects.toMatchObject({ code: 'INTEGRITY' });
    expect(await snapshotTables(db)).toEqual(before);
  });

  test('duplicate active completions (constraint violation) roll back', async () => {
    const tampered = structuredClone(goodBackup);
    const active = tampered.tables.quest_completions.find((row) => row.undone_at == null);
    tampered.tables.quest_completions.push({ ...active, id: `${active.id}-dup` });
    await expect(restoreBackup(inspectBackup(JSON.stringify(tampered)))).rejects.toThrow(/UNIQUE/);
    expect(await snapshotTables(db)).toEqual(before);
  });
});
