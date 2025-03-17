import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatFinishTimerStartIf } from "../../interfaces/responseIf";
import { formatFinishTimerStartSchema } from "../schemas/responseSchemas";

async function formatFinishTimerStartValidator(
    data: formatFinishTimerStartIf,
): Promise<formatFinishTimerStartIf> {
    try {
        Joi.assert(data, formatFinishTimerStartSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatFinishTimerStartValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatFinishTimerStartValidator
