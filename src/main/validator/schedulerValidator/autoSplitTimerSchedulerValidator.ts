import { AutoSplitTimerQueueIf } from "../../interfaces/schedulerIf";
import logger = require("../../../logger");
import Errors from "../../errors"
import Joi from "joi"
import { autoSplitTimerSchedulerSchema } from "../schemas/schedulerSchemas";


async function autoSplitTimerSchedulerValidator(
    data: AutoSplitTimerQueueIf
): Promise<AutoSplitTimerQueueIf> {
    try {
        Joi.assert(data, autoSplitTimerSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : bootAmountCollectSchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = autoSplitTimerSchedulerValidator;