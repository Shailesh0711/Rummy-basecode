import { lockInPeriodTimerQueueIf } from "../../interfaces/schedulerIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { lockInPeriodTimerSchedulerSchema } from "../schemas/schedulerSchemas";

async function lockInPeriodTimerValidator(
    data: lockInPeriodTimerQueueIf,
): Promise<lockInPeriodTimerQueueIf> {
    try {
        Joi.assert(data, lockInPeriodTimerSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : lockInPeriodTimerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = lockInPeriodTimerValidator;