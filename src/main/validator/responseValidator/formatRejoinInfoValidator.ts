import Joi from "joi";
import logger from "../../../logger";
import { formatRejoinInfoIf } from "../../interfaces/responseIf";
import Errors from "../../errors"
import { formatRejoinInfoSchema } from "../schemas/responseSchemas";

async function formatRejoinInfoValidator(
    data: formatRejoinInfoIf
): Promise<formatRejoinInfoIf> {
    try {
        Joi.assert(data, formatRejoinInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatRejoinInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatRejoinInfoValidator;