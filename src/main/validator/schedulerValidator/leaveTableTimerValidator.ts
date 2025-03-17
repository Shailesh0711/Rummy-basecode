import Errors from "../../errors"
import Joi from "joi"
import logger from "../../../logger";
import { leaveTableTimerIf } from "../../interfaces/schedulerIf";
import { leaveTableTimerSchedulerSchema } from "../schemas/schedulerSchemas";

async function leaveTableTimerValidator(
    data: leaveTableTimerIf
): Promise<leaveTableTimerIf> {
    try {
        Joi.assert(data, leaveTableTimerSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : leaveTableTimerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = leaveTableTimerValidator;
