/** Thrown for invalid progression input or configuration. `code` is stable for callers to branch on. */
export class ProgressionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ProgressionError';
    this.code = code;
  }
}
