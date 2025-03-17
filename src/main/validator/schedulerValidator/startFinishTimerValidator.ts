import { StartFinishTimerQueueIf } from "../../interfaces/schedulerIf";
import Errors from "../../errors"
import Joi from "joi"
import logger from "../../../logger";
import { startFinishTimerSchedulerSchema } from "../schemas/schedulerSchemas";


async function startFinishTimerValidator(
    data: StartFinishTimerQueueIf
): Promise<StartFinishTimerQueueIf> {
    try {
        Joi.assert(data, startFinishTimerSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : startFinishTimerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = startFinishTimerValidator;