import { finishTimerStartRequestIf } from "../../../interfaces/requestIf";
import Joi from "joi";
import logger from "../../../../logger";
import Errors from "../../../errors";
import { finishTimerSchema } from "../../schemas/requestSchemas";

async function finishTimerValidator(
    data:finishTimerStartRequestIf
):Promise<finishTimerStartRequestIf>{
    try {
        Joi.assert(data, finishTimerSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : finishTimerValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = finishTimerValidator;