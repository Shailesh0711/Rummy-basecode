import logger from "../../../logger";
import { formatTossCardInfoIf } from "../../interfaces/responseIf";
import Joi from "joi";
import Errors from "../../errors"
import { formatTossCardInfoSchema } from "../schemas/responseSchemas";

async function formatTossCardInfoValidator(
    data: formatTossCardInfoIf,
): Promise<formatTossCardInfoIf> {
    try {
        Joi.assert(data, formatTossCardInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatTossCardInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = formatTossCardInfoValidator