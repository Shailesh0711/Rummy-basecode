class CustomError extends Error {
    public name: any;
    public message: any;
    public cause: any;
    public reason: any;
    public retry: any;

    constructor(message?: any, cause?: any, reason?: any, retry?: any) {
        super();
        this.name = this.constructor.name;
        this.message = message;
        this.cause = cause;
        this.reason = reason;
        this.retry = retry;
        Object.setPrototypeOf(this, CustomError.prototype)
    }
}

export = CustomError;