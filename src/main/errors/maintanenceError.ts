import CustomError from './customError';

class maintanenceError extends CustomError {
  constructor(message: any) {
    super();
    this.message = message;

    Object.setPrototypeOf(this, maintanenceError.prototype);
  }
}

export = maintanenceError;
