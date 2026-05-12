// Manual Jest mock for @humonics/sdk
// Prevents Jest from loading the ESM dist

class HumonicsError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'HumonicsError';
    this.code = code;
    this.cause = cause;
  }
}

class HumonicsClient {
  constructor() {
    this.verify = jest.fn();
    this.batchVerify = jest.fn();
    this.issue = jest.fn();
    this.revoke = jest.fn();
  }
}

module.exports = { HumonicsClient, HumonicsError };
