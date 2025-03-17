import { formatScoreBoardInfoIf } from "../../interfaces/responseIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatScoreBoardInfoSchema } from "../schemas/responseSchemas";

async function formatScoreBoardInfoValidator(
    data: formatScoreBoardInfoIf
): Promise<formatScoreBoardInfoIf> {
    try {
        Joi.assert(data, formatScoreBoardInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatScoreBoardInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatScoreBoardInfoValidator;