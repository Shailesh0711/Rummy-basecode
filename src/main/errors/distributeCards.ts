import CustomError from './customError';

class distributeCardsError extends CustomError {
  constructor(message: any) {
    super();
    this.message = message;

    Object.setPrototypeOf(this, distributeCardsError.prototype);
  }
}

export = distributeCardsError;
