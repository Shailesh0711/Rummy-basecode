import { distributeCardsQueueIf } from "../../interfaces/schedulerIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { distributeCardsSchedulerSchema } from "../schemas/schedulerSchemas";

async function distributeCardsSchedulerValidator(
    data: distributeCardsQueueIf
): Promise<distributeCardsQueueIf> {
    try {
        Joi.assert(data, distributeCardsSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : distributeCardsSchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = distributeCardsSchedulerValidator