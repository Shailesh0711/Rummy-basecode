import Joi from "joi";
import logger from "../../../logger";
import { formatBootCollectionInfoIf } from "../../interfaces/responseIf";
import Errors from "../../errors"
import { formatBootCollectionInfoSchema } from "../schemas/responseSchemas";

async function formatBootCollectionInfoValidator(
    data: formatBootCollectionInfoIf
): Promise<formatBootCollectionInfoIf> {
    try {
        Joi.assert(data, formatBootCollectionInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatBootCollectionInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatBootCollectionInfoValidator;