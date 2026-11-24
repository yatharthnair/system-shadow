/**
 * SQL for progression. Every function takes the connection (`db`) to run on, so callers can
 * pass the `txn` from an exclusive transaction and tests can pass an in-memory database.
 * No business rules here — see progression-engine.js.
 */

export async function ensureAttributeRows(db, attributeKeys) {
  for (const key of attributeKeys) {
    await db.runAsync('INSERT OR IGNORE INTO player_attributes (attribute_key) VALUES (?)', key);
  }
}

/** Current stored totals: `{ totalXp, attributeXp }`. */
export async function readProgressionState(db, attributeKeys) {
  const player = await db.getFirstAsync('SELECT total_xp FROM player WHERE id = 1');
  const rows = await db.getAllAsync('SELECT attribute_key, total_xp FROM player_attributes');
  const storedByKey = Object.fromEntries(rows.map((row) => [row.attribute_key, row.total_xp]));

  return {
    totalXp: player?.total_xp ?? 0,
    attributeXp: Object.fromEntries(attributeKeys.map((key) => [key, storedByKey[key] ?? 0])),
  };
}

const SIGNED_XP = "CASE WHEN t.kind = 'reversal' THEN -{column} ELSE {column} END";

/** Totals recomputed from the XP ledger (awards minus reversals), the source of truth. */
export async function readLedgerTotals(db, attributeKeys) {
  const player = await db.getFirstAsync(
    `SELECT COALESCE(SUM(${SIGNED_XP.replaceAll('{column}', 't.xp')}), 0) AS total_xp FROM xp_transactions t`,
  );
  const rows = await db.getAllAsync(
    `SELECT a.attribute_key, SUM(${SIGNED_XP.replaceAll('{column}', 'a.xp')}) AS total_xp
     FROM xp_transaction_attributes a
     JOIN xp_transactions t ON t.id = a.transaction_id
     GROUP BY a.attribute_key`,
  );
  const ledgerByKey = Object.fromEntries(rows.map((row) => [row.attribute_key, row.total_xp]));

  return {
    totalXp: player.total_xp,
    attributeXp: Object.fromEntries(attributeKeys.map((key) => [key, ledgerByKey[key] ?? 0])),
  };
}

export async function hasXpTransaction(db, transactionId) {
  const row = await db.getFirstAsync('SELECT 1 AS found FROM xp_transactions WHERE id = ?', transactionId);
  return row != null;
}

/**
 * A ledger entry with its attribute XP, or null.
 * @returns {Promise<null | { id, source, xp, kind, attributeXp, reversedByTransactionId: string | null }>}
 */
export async function readXpTransaction(db, transactionId) {
  const row = await db.getFirstAsync('SELECT id, source, xp, kind FROM xp_transactions WHERE id = ?', transactionId);
  if (!row) return null;

  const attributeRows = await db.getAllAsync(
    'SELECT attribute_key, xp FROM xp_transaction_attributes WHERE transaction_id = ?',
    transactionId,
  );
  const reversal = await db.getFirstAsync(
    'SELECT id FROM xp_transactions WHERE reverses_transaction_id = ?',
    transactionId,
  );

  return {
    ...row,
    attributeXp: Object.fromEntries(attributeRows.map((attributeRow) => [attributeRow.attribute_key, attributeRow.xp])),
    reversedByTransactionId: reversal?.id ?? null,
  };
}

/**
 * Appends a reversal entry that cancels `award`. The unique index on `reverses_transaction_id`
 * makes a second reversal of the same award fail.
 */
export async function insertXpReversal(db, award, reversalId) {
  await db.runAsync(
    "INSERT INTO xp_transactions (id, source, xp, kind, reverses_transaction_id) VALUES (?, ?, ?, 'reversal', ?)",
    reversalId,
    award.source,
    award.xp,
    award.id,
  );
  for (const [attributeKey, xp] of Object.entries(award.attributeXp)) {
    await db.runAsync(
      'INSERT INTO xp_transaction_attributes (transaction_id, attribute_key, xp) VALUES (?, ?, ?)',
      reversalId,
      attributeKey,
      xp,
    );
  }
}

/** Appends a reward to the ledger. Throws on a duplicate id (primary key), as a last line of defence. */
export async function insertXpTransaction(db, reward) {
  await db.runAsync('INSERT INTO xp_transactions (id, source, xp) VALUES (?, ?, ?)', reward.id, reward.source, reward.xp);
  for (const [attributeKey, xp] of Object.entries(reward.attributeXp)) {
    await db.runAsync(
      'INSERT INTO xp_transaction_attributes (transaction_id, attribute_key, xp) VALUES (?, ?, ?)',
      reward.id,
      attributeKey,
      xp,
    );
  }
}

/**
 * Writes totals. `level` and `xpIntoLevel` fill the legacy `player.level` / `player.xp`
 * columns as a cache for anyone inspecting the database; the app always derives them.
 */
export async function writeProgressionState(db, { totalXp, attributeXp }, { level, xpIntoLevel }) {
  await db.runAsync('UPDATE player SET total_xp = ?, level = ?, xp = ? WHERE id = 1', totalXp, level, xpIntoLevel);
  for (const [attributeKey, attributeTotalXp] of Object.entries(attributeXp)) {
    await db.runAsync(
      `INSERT INTO player_attributes (attribute_key, total_xp) VALUES (?, ?)
       ON CONFLICT (attribute_key) DO UPDATE SET total_xp = excluded.total_xp`,
      attributeKey,
      attributeTotalXp,
    );
  }
}
