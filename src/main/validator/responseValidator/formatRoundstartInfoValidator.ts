import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatRoundstartInfoIf } from "../../interfaces/responseIf";
import { formatRoundstartInfoSchema } from "../schemas/responseSchemas";

async function formatRoundstartInfoValidator(
    data: formatRoundstartInfoIf
): Promise<formatRoundstartInfoIf> {
    try {
        Joi.assert(data, formatRoundstartInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatRoundstartInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatRoundstartInfoValidator;