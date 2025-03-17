import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { tossCardTimerQueueIf } from "../../interfaces/schedulerIf";
import { tossCardGameplaySchedulerSchema } from "../schemas/schedulerSchemas";


async function tossCardTSchedulerValidator(
    data: tossCardTimerQueueIf
): Promise<tossCardTimerQueueIf> {
    try {
        Joi.assert(data, tossCardGameplaySchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : tossCardTSchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = tossCardTSchedulerValidator;