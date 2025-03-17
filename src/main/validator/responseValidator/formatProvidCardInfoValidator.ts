import { formatProvidCardInfoIf } from "../../interfaces/responseIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatProvidCardInfoSchema } from "../schemas/responseSchemas";

async function formatProvidCardInfoValidator(
    data: formatProvidCardInfoIf
): Promise<formatProvidCardInfoIf> {
    try {
        Joi.assert(data, formatProvidCardInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatProvidCardInfoValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatProvidCardInfoValidator;