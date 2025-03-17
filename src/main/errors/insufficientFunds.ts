import CustomError from './customError';

class InsufficientFundError extends CustomError {
  constructor(message: any) {
    super();
    this.message = message;

    Object.setPrototypeOf(this, InsufficientFundError.prototype);
  }
}

export = InsufficientFundError;