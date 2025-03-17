import { declareRequestIf } from "../../../interfaces/requestIf";
import Joi from "joi";
import logger from "../../../../logger";
import Errors from "../../../errors";
import { declareSchema } from "../../schemas/requestSchemas";

async function declareValidator(
    data: declareRequestIf
): Promise<declareRequestIf> {
    try {
        Joi.assert(data, declareSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : declareValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = declareValidator;