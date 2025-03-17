import { bootAmountCollectQueueIf } from "../../interfaces/schedulerIf";
import logger = require("../../../logger");
import Errors from "../../errors"
import Joi from "joi"
import { arrageSeatingSchedulerSchema } from "../schemas/schedulerSchemas";


async function arrageSeatingSchedulerValidator(
    data: bootAmountCollectQueueIf,
): Promise<bootAmountCollectQueueIf> {
    try {
        Joi.assert(data, arrageSeatingSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : bootAmountCollectSchedulerValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = arrageSeatingSchedulerValidator;