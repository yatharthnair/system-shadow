import { DatabaseSync } from 'node:sqlite';

function toParams(params) {
  return params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
}

/** Converts node:sqlite's null-prototype rows into plain objects. */
function toPlainRow(row) {
  return row ? { ...row } : null;
}

/**
 * In-memory SQLite database exposing the subset of the expo-sqlite async API this app uses.
 * Backed by Node's built-in `node:sqlite`, so tests run the real SQL, schema and migrations.
 */
export function createTestDatabase() {
  const connection = new DatabaseSync(':memory:');
  let inTransaction = false;

  async function runInTransaction(beginStatement, task) {
    if (inTransaction) throw new Error('cannot start a transaction within a transaction');
    inTransaction = true;
    connection.exec(beginStatement);
    try {
      await task();
      connection.exec('COMMIT');
    } catch (error) {
      connection.exec('ROLLBACK');
      throw error;
    } finally {
      inTransaction = false;
    }
  }

  const db = {
    async execAsync(source) {
      connection.exec(source);
    },
    async runAsync(source, ...params) {
      const result = connection.prepare(source).run(...toParams(params));
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    async getFirstAsync(source, ...params) {
      return toPlainRow(connection.prepare(source).get(...toParams(params)));
    },
    async getAllAsync(source, ...params) {
      return connection.prepare(source).all(...toParams(params)).map(toPlainRow);
    },
    async withTransactionAsync(task) {
      await runInTransaction('BEGIN', task);
    },
    async withExclusiveTransactionAsync(task) {
      await runInTransaction('BEGIN EXCLUSIVE', () => task(db));
    },
    close() {
      connection.close();
    },
  };

  return db;
}
