import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { splitAmountTimerIf } from "../../interfaces/schedulerIf";
import { splitAmountTimerSchema } from "../schemas/schedulerSchemas";


async function splitAmountTimerValidator(
    data: splitAmountTimerIf
): Promise<splitAmountTimerIf> {
    try {
        Joi.assert(data, splitAmountTimerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : splitAmountTimerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = splitAmountTimerValidator;