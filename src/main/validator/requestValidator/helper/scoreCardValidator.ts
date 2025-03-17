import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { scoreCardSchema } from "../../schemas/requestSchemas";
import { scoreCardReqIf } from "../../../interfaces/requestIf";

async function scoreCardValidator(
    data: scoreCardReqIf
): Promise<scoreCardReqIf> {
    try {
        Joi.assert(data,scoreCardSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : scoreCardValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = scoreCardValidator;