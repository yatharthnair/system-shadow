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

/** Totals recomputed from the XP ledger, the source of truth. */
export async function readLedgerTotals(db, attributeKeys) {
  const player = await db.getFirstAsync('SELECT COALESCE(SUM(xp), 0) AS total_xp FROM xp_transactions');
  const rows = await db.getAllAsync(
    'SELECT attribute_key, SUM(xp) AS total_xp FROM xp_transaction_attributes GROUP BY attribute_key',
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
