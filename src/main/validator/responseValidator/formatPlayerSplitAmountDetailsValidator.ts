import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatPlayerSplitAmountDetailsIf } from "../../interfaces/responseIf";
import { formatPlayerSplitAmountDetailsSchema } from "../schemas/responseSchemas";

async function formatPlayerSplitAmountDetailsValidator(
    data: formatPlayerSplitAmountDetailsIf
): Promise<formatPlayerSplitAmountDetailsIf> {
    try {
        Joi.assert(data, formatPlayerSplitAmountDetailsSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatPlayerSplitAmountDetailsValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatPlayerSplitAmountDetailsValidator;