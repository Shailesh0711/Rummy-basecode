import logger from "../../../logger";
import { formatSortCardInfoIf } from "../../interfaces/responseIf";
import Errors from '../../errors'
import Joi from "joi"
import { formatSortCardInfoSchema } from "../schemas/responseSchemas";

async function formatSortCardInfoValidator(
    data: formatSortCardInfoIf
): Promise<formatSortCardInfoIf> {
    try {
        Joi.assert(data, formatSortCardInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatSortCardInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatSortCardInfoValidator;