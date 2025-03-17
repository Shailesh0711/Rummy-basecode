import CustomError from './customError';

class CancelBattle extends CustomError {
  constructor(message: any) {
    super();
    this.message = message;

    Object.setPrototypeOf(this, CancelBattle.prototype);
  }
}

export = CancelBattle;