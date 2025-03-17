import logger from "../../../logger";
import Errors from "../../errors"
import Joi from "joi"
import { formatSingUpInfoSchema } from "../schemas/responseSchemas";
import { userIf } from "../../interfaces/userSignUpIf";
import { formatSingUpInfoIf } from "../../interfaces/responseIf";

async function formatSignUpInfoValidator(
    data: formatSingUpInfoIf,
): Promise<formatSingUpInfoIf> {
    try {
        Joi.assert(data, formatSingUpInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatSingUpInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = formatSignUpInfoValidator