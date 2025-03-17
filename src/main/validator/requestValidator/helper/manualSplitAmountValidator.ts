import { manualSplitAmountRequestIf } from "../../../interfaces/requestIf";
import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { manualSplitAmountSchema } from "../../schemas/requestSchemas";

async function manualSplitAmountValidator(
    data: manualSplitAmountRequestIf
): Promise<manualSplitAmountRequestIf> {
    try {
        Joi.assert(data, manualSplitAmountSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : manualSplitAmountValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = manualSplitAmountValidator;