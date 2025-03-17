import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { reShuffleCardQueueIf } from "../../interfaces/schedulerIf";
import { reShuffleCardsSchedulerSchema } from "../schemas/schedulerSchemas";


async function reShuffleCardsSchedulerValidator(
    data: reShuffleCardQueueIf
): Promise<reShuffleCardQueueIf> {
    try {
        Joi.assert(data, reShuffleCardsSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : reShuffleCardsSchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = reShuffleCardsSchedulerValidator;