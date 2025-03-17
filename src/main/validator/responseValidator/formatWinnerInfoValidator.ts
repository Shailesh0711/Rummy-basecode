import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatWinnerInfoIf } from "../../interfaces/responseIf";
import { formatWinnerInfoSchema } from "../schemas/responseSchemas";

async function formatWinnerInfoValidator(
    data: formatWinnerInfoIf
): Promise<formatWinnerInfoIf> {
    try {
        Joi.assert(data, formatWinnerInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatWinnerInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = formatWinnerInfoValidator;