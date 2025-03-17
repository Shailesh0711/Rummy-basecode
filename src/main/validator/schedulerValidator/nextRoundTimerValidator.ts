import { NextRoundTimerQueueIf } from "../../interfaces/schedulerIf";
import Errors from "../../errors"
import Joi from "joi"
import logger from "../../../logger";
import { nextRoundTimerSchedulerSchema } from "../schemas/schedulerSchemas";

async function nextRoundTimerValidator(
    data: NextRoundTimerQueueIf
): Promise<NextRoundTimerQueueIf> {
    try {
        Joi.assert(data, nextRoundTimerSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : nextRoundTimerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = nextRoundTimerValidator;