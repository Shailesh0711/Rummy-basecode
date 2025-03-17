import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatdiscardCardInfoIf } from "../../interfaces/responseIf";
import { formatdiscardCardInfoSchema } from "../schemas/responseSchemas";


async function formatdiscardCardInfoValidator(
    data: formatdiscardCardInfoIf
): Promise<formatdiscardCardInfoIf> {
    try {
        Joi.assert(data, formatdiscardCardInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatdiscardCardInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatdiscardCardInfoValidator;