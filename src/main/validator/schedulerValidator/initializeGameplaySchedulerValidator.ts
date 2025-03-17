import { initializeGameplayIf } from "../../interfaces/schedulerIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import initializeGameplaySchedulerSchema from "../schemas/schedulerSchemas/initializeGameplaySchedulerSchema";

async function initializeGameplaySchedulerValidator(
    data: initializeGameplayIf,
): Promise<initializeGameplayIf> {
    try {
        Joi.assert(data, initializeGameplaySchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : initializeGameplaySchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = initializeGameplaySchedulerValidator;