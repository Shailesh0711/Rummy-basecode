import logger from "../../../logger";
import { formatReShuffleDeckInfoIf } from "../../interfaces/responseIf";
import Joi from "joi"
import Errors from "../../errors";
import { formatReShuffleDeckInfoSchema } from "../schemas/responseSchemas";

async function formatReShuffleDeckInfoValidator(
    data: formatReShuffleDeckInfoIf
): Promise<formatReShuffleDeckInfoIf> {
    try {
        Joi.assert(data, formatReShuffleDeckInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatReShuffleDeckInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatReShuffleDeckInfoValidator;