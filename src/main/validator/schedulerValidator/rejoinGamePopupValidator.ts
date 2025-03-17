import { RejoinGamePopupQueueIf } from "../../interfaces/schedulerIf";
import Errors from "../../errors"
import Joi from "joi"
import logger from "../../../logger";
import { rejoinGamePopupSchedulerSchema } from "../schemas/schedulerSchemas";

async function rejoinGamePopupValidator(
    data: RejoinGamePopupQueueIf
): Promise<RejoinGamePopupQueueIf> {
    try {
        Joi.assert(data, rejoinGamePopupSchedulerSchema);
        return data;
    } catch (error) {
        console.log("CATCH_ERROR : rejoinGamePopupValidator :: ", error)
        logger.error(
            'CATCH_ERROR : rejoinGamePopupValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = rejoinGamePopupValidator;
