import { getDatabase } from '@/database/database';
import { LEGACY_XP_TRANSACTION_ID, runMigrations } from '@/database/migrations';
import { createTestDatabase } from '@/test-utils/create-test-database';

import { buildProgressionSnapshot } from '../progression-engine';
import * as progressionRepository from '../progression-repository';
import { awardXp, loadProgression } from '../progression-service';

jest.mock('@/database/database', () => ({ getDatabase: jest.fn() }));

let db;

beforeEach(async () => {
  db = createTestDatabase();
  await runMigrations(db);
  getDatabase.mockResolvedValue(db);
});

afterEach(() => {
  jest.restoreAllMocks();
  db.close();
});

async function countRows(table) {
  return (await db.getFirstAsync(`SELECT COUNT(*) AS count FROM ${table}`)).count;
}

describe('awardXp', () => {
  test('applies a reward and persists player and attribute totals', async () => {
    const outcome = await awardXp({ id: 'quest:a', source: 'quest', xp: 150, attributeXp: { strength: 40 } });

    expect(outcome.status).toBe('applied');
    expect(outcome.events).toContainEqual({ type: 'player-level-up', fromLevel: 1, toLevel: 2, levelsGained: 1 });

    const player = await db.getFirstAsync('SELECT total_xp, level, xp FROM player WHERE id = 1');
    expect(player).toEqual({ total_xp: 150, level: 2, xp: 50 });
    const strength = await db.getFirstAsync("SELECT total_xp FROM player_attributes WHERE attribute_key = 'strength'");
    expect(strength.total_xp).toBe(40);
  });

  test('a repeated transaction id is ignored', async () => {
    const reward = { id: 'quest:pushups:2026-11-25', source: 'quest', xp: 100, attributeXp: { strength: 10 } };

    expect((await awardXp(reward)).status).toBe('applied');
    const duplicate = await awardXp(reward);

    expect(duplicate).toMatchObject({ status: 'duplicate', events: [] });
    expect(duplicate.state.totalXp).toBe(100);
    expect(duplicate.state.attributeXp.strength).toBe(10);
    expect(await countRows('xp_transactions')).toBe(1);
  });

  test('concurrent awards with the same id apply exactly once', async () => {
    const reward = { id: 'quest:double-tap', source: 'quest', xp: 75 };
    const outcomes = await Promise.all([awardXp(reward), awardXp(reward), awardXp(reward)]);

    expect(outcomes.map((outcome) => outcome.status).sort()).toEqual(['applied', 'duplicate', 'duplicate']);
    expect((await loadProgression()).state.totalXp).toBe(75);
  });

  test('concurrent distinct awards are all applied with no lost updates', async () => {
    await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        awardXp({ id: `quest:${index}`, source: 'quest', xp: 10, attributeXp: { agility: 1 } }),
      ),
    );
    const { state } = await loadProgression();
    expect(state.totalXp).toBe(200);
    expect(state.attributeXp.agility).toBe(20);
  });

  test('a large reward reports multiple level-ups and rank-up', async () => {
    const outcome = await awardXp({ id: 'boss', source: 'challenge', xp: 60_000 });
    const levelUp = outcome.events.find((event) => event.type === 'player-level-up');
    expect(levelUp.levelsGained).toBeGreaterThan(1);
    expect(outcome.events).toContainEqual(expect.objectContaining({ type: 'rank-up', fromRank: 'E' }));
  });

  test('invalid input is rejected before touching the database', async () => {
    await expect(awardXp({ id: 'bad', source: 'quest', xp: -5 })).rejects.toMatchObject({ code: 'INVALID_XP' });
    expect(await countRows('xp_transactions')).toBe(0);
  });

  test('a failure mid-transaction rolls everything back, and the id can be retried', async () => {
    jest.spyOn(progressionRepository, 'writeProgressionState').mockRejectedValueOnce(new Error('disk full'));

    await expect(awardXp({ id: 'quest:retry', source: 'quest', xp: 500 })).rejects.toThrow('disk full');
    expect(await countRows('xp_transactions')).toBe(0);
    expect((await loadProgression()).state.totalXp).toBe(0);

    expect((await awardXp({ id: 'quest:retry', source: 'quest', xp: 500 })).status).toBe('applied');
  });

  test('a failed award does not block later awards in the queue', async () => {
    jest.spyOn(progressionRepository, 'insertXpTransaction').mockRejectedValueOnce(new Error('boom'));
    const results = await Promise.allSettled([
      awardXp({ id: 'first', source: 'quest', xp: 10 }),
      awardXp({ id: 'second', source: 'quest', xp: 20 }),
    ]);
    expect(results.map((result) => result.status)).toEqual(['rejected', 'fulfilled']);
    expect((await loadProgression()).state.totalXp).toBe(20);
  });
});

describe('loadProgression — consistency across restarts', () => {
  test('a fresh database starts at level 1 with all six attributes', async () => {
    const { state, repaired } = await loadProgression();
    expect(repaired).toBe(false);
    expect(buildProgressionSnapshot(state)).toMatchObject({ level: 1, rank: 'E', totalXp: 0 });
    expect(Object.keys(state.attributeXp)).toHaveLength(6);
  });

  test('progress survives a restart (state is re-read from SQLite, not memory)', async () => {
    await awardXp({ id: 'a', source: 'quest', xp: 400, attributeXp: { intelligence: 90 } });
    await awardXp({ id: 'b', source: 'quest', xp: 250, attributeWeights: { vitality: 1, charisma: 1 } });

    const before = buildProgressionSnapshot((await loadProgression()).state);

    // "Restart": re-run migrations (no-op at the latest version) and reload.
    await runMigrations(db);
    const { state, repaired } = await loadProgression();

    expect(repaired).toBe(false);
    expect(buildProgressionSnapshot(state)).toEqual(before);
    expect(state).toEqual({
      totalXp: 650,
      attributeXp: { strength: 0, agility: 0, vitality: 125, intelligence: 90, discipline: 0, charisma: 125 },
    });
  });

  test('repairs stored totals from the ledger if they ever disagree', async () => {
    await awardXp({ id: 'a', source: 'quest', xp: 300, attributeXp: { strength: 20 } });
    await db.runAsync('UPDATE player SET total_xp = 999999 WHERE id = 1');
    await db.runAsync("UPDATE player_attributes SET total_xp = 0 WHERE attribute_key = 'strength'");

    const { state, repaired } = await loadProgression();
    expect(repaired).toBe(true);
    expect(state.totalXp).toBe(300);
    expect(state.attributeXp.strength).toBe(20);

    expect((await loadProgression()).repaired).toBe(false);
  });
});

describe('migration v3', () => {
  test('converts legacy level/xp into a lifetime total recorded in the ledger', async () => {
    const legacyDb = createTestDatabase();
    // Simulate a device that ran the foundation build (schema v2) and earned XP.
    await legacyDb.execAsync(`
      CREATE TABLE player (id INTEGER PRIMARY KEY CHECK (id = 1), name TEXT NOT NULL, level INTEGER NOT NULL DEFAULT 1,
        xp INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
      CREATE TABLE quests (id TEXT PRIMARY KEY NOT NULL, template_id TEXT NOT NULL, title TEXT NOT NULL,
        category TEXT NOT NULL, xp_reward INTEGER NOT NULL, completed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));
      INSERT INTO player (id, name, level, xp) VALUES (1, 'Hunter', 3, 40);
      ALTER TABLE player ADD COLUMN title TEXT NOT NULL DEFAULT 'Unawakened';
      ALTER TABLE player ADD COLUMN strength INTEGER NOT NULL DEFAULT 10;
      ALTER TABLE player ADD COLUMN agility INTEGER NOT NULL DEFAULT 10;
      ALTER TABLE player ADD COLUMN intelligence INTEGER NOT NULL DEFAULT 10;
      ALTER TABLE player ADD COLUMN vitality INTEGER NOT NULL DEFAULT 10;
      ALTER TABLE player ADD COLUMN discipline INTEGER NOT NULL DEFAULT 10;
      PRAGMA user_version = 2;
    `);
    getDatabase.mockResolvedValue(legacyDb);

    await runMigrations(legacyDb);
    const { state, repaired } = await loadProgression();

    // Level 3 + 40 XP under the old curve = 100 (L1) + 283 (L2) + 40.
    expect(state.totalXp).toBe(423);
    expect(repaired).toBe(false);
    expect(buildProgressionSnapshot(state)).toMatchObject({ level: 3, xpIntoLevel: 40 });
    const ledgerRow = await legacyDb.getFirstAsync('SELECT id, xp FROM xp_transactions');
    expect(ledgerRow).toEqual({ id: LEGACY_XP_TRANSACTION_ID, xp: 423 });
    legacyDb.close();
  });
});
