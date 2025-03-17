import CustomError from "./customError";

class InvalidInput extends CustomError {
    constructor(message: any) {
        super();
        this.message = message;

        Object.setPrototypeOf(this, InvalidInput.prototype);
    }
}

export = InvalidInput