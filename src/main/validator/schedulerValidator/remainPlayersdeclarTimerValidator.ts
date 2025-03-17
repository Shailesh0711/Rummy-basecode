import { RemainPlayersdeclarTimerQueueIf } from "../../interfaces/schedulerIf";
import Errors from "../../errors"
import Joi from "joi"
import logger from "../../../logger";
import { remainPlayersdeclarTimerSchedulerSchema } from "../schemas/schedulerSchemas";

async function remainPlayersdeclarTimerValidator(
    data: RemainPlayersdeclarTimerQueueIf
): Promise<RemainPlayersdeclarTimerQueueIf> {
    try {
        Joi.assert(data, remainPlayersdeclarTimerSchedulerSchema);
        return data;
    } catch (error) {
        console.log("CATCH_ERROR : remainPlayersdeclarTimerValidator :: ",error)
        logger.error(
            'CATCH_ERROR : remainPlayersdeclarTimerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = remainPlayersdeclarTimerValidator;
