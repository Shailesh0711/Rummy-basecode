import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { waitingForPlayerIf } from "../../interfaces/schedulerIf";
import { waitingForPlayerSchedulerSchema } from "../schemas/schedulerSchemas";

async function waitingForPlayerSchedulerValidator(
    data: waitingForPlayerIf
): Promise<waitingForPlayerIf> {
    try {
        Joi.assert(data, waitingForPlayerSchedulerSchema)
        return data
    } catch (error) {
        logger.error(
            'CATCH_ERROR : waitingForPlayerSchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = waitingForPlayerSchedulerValidator
