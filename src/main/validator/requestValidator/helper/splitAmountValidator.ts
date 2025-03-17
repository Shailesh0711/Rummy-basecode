import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { splitAmountRequestIf } from "../../../interfaces/requestIf";
import { splitAmounttSchema } from "../../schemas/requestSchemas";

async function splitAmountValidator(
    data: splitAmountRequestIf
): Promise<splitAmountRequestIf> {
    try {
        Joi.assert(data, splitAmounttSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : splitAmountValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = splitAmountValidator;