import { groupCardRequestIf } from "../../../interfaces/requestIf";
import Joi from "joi"
import logger from "../../../../logger";
import Errors from "../../../errors";
import { groupCardSchema } from "../../schemas/requestSchemas";



async function groupCardValidator(
    data: groupCardRequestIf
): Promise<groupCardRequestIf> {
    try {
        Joi.assert(data, groupCardSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : groupCardValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = groupCardValidator;