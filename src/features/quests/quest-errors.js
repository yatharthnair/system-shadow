/**
 * Thrown for invalid quest operations. `code` is stable for callers to branch on;
 * `fieldErrors` maps form fields to messages for validation failures.
 */
export class QuestError extends Error {
  constructor(code, message, fieldErrors = null) {
    super(message);
    this.name = 'QuestError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
