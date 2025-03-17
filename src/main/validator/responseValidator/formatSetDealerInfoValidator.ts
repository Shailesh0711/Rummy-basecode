import { setDealerInfoIf } from "../../interfaces/responseIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatSetDealerInfoSchedulerSchema } from "../schemas/responseSchemas";

async function formatSetDealerInfoValidator(
    data: setDealerInfoIf
): Promise<setDealerInfoIf> {
    try {
        Joi.assert(data, formatSetDealerInfoSchedulerSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatSetDealerInfoValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatSetDealerInfoValidator;