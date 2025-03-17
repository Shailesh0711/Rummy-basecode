import CustomError from './customError';

class UnauthorizedError extends CustomError {
  constructor(message: any) {
    super();
    this.message = message;

    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export = UnauthorizedError;