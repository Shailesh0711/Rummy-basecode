import { discardCardRequestIf } from "../../../interfaces/requestIf";
import Joi from "joi";
import logger from "../../../../logger";
import Errors from "../../../errors";
import { discardCardSchema } from "../../schemas/requestSchemas";



async function discardCardValidator(
    data: discardCardRequestIf
): Promise<discardCardRequestIf> {
    try {
        Joi.assert(data, discardCardSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : discardCardValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = discardCardValidator;