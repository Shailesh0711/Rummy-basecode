import { signUpRequestIf } from "../../../interfaces/requestIf";
const Joi = require("joi")
import Errors from "../../../errors"
import logger from "../../../../logger";
import { requestSchemas } from "../../schemas";

async function signUpValidator(
    data: signUpRequestIf
): Promise<signUpRequestIf> {
    try {
        Joi.assert(data, requestSchemas.signUpSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : signUpValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = signUpValidator