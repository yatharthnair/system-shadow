export class RewardError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RewardError';
    this.code = code;
  }
}
