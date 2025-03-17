import logger from "../../../logger";
import Errors from "../../errors"
import Joi from "joi"
import { formatSignupAckIf } from "../../interfaces/responseIf";
import { formatSignupAckSchema } from "../schemas/responseSchemas";


async function formatSignupAckValidator(
    data: formatSignupAckIf
) {
    try {
        Joi.assert(data, formatSignupAckSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatSignupAckValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatSignupAckValidator;