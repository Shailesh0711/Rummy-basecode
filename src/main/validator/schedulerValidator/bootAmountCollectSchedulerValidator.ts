import { bootAmountCollectQueueIf } from "../../interfaces/schedulerIf";
import logger = require("../../../logger");
import Errors from "../../errors"
import Joi from "joi"
import { bootAmountCollectSchedulerSchema } from "../schemas/schedulerSchemas";


async function bootAmountCollectSchedulerValidator(
    data: bootAmountCollectQueueIf,
): Promise<bootAmountCollectQueueIf> {
    try {
        Joi.assert(data, bootAmountCollectSchedulerSchema);
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

export = bootAmountCollectSchedulerValidator;