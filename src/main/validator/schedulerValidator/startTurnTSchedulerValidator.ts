import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { startTurnTimerQueueIf } from "../../interfaces/schedulerIf";
import { startTurnGameplaySchedulerSchema } from "../schemas/schedulerSchemas";


async function startTurnTSchedulerValidator(
    data: startTurnTimerQueueIf
): Promise<startTurnTimerQueueIf> {
    try {
        Joi.assert(data, startTurnGameplaySchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : startTurnTSchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = startTurnTSchedulerValidator;