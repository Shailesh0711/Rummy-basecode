import CustomError from './customError';

class createCardGameTableError extends CustomError {
  constructor(message: any) {
    super();
    this.message = message;

    Object.setPrototypeOf(this, createCardGameTableError.prototype);
  }
}

export = createCardGameTableError;
