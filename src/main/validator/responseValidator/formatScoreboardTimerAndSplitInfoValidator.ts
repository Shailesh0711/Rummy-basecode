import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatScoreboardTimerAndSplitInfoIf } from "../../interfaces/responseIf";
import { formatScoreboardTimerAndSplitInfoSchema } from "../schemas/responseSchemas";


async function formatScoreboardTimerAndSplitInfoValidator(
    data: formatScoreboardTimerAndSplitInfoIf
): Promise<formatScoreboardTimerAndSplitInfoIf> {
    try {
        Joi.assert(data, formatScoreboardTimerAndSplitInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatScoreboardTimerAndSplitInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatScoreboardTimerAndSplitInfoValidator;