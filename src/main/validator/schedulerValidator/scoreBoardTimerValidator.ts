import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { scoreBoardTimerIf } from "../../interfaces/schedulerIf";
import { scoreBoardTimerSchema } from "../schemas/schedulerSchemas";


async function scoreBoardTimerValidator(
    data: scoreBoardTimerIf
): Promise<scoreBoardTimerIf> {
    try {
        Joi.assert(data, scoreBoardTimerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : scoreBoardTimerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = scoreBoardTimerValidator;