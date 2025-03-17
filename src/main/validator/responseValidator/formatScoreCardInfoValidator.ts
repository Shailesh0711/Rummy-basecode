import { formatScoreCardInfoIf, setDealerInfoIf } from "../../interfaces/responseIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import formatScoreCardInfoSchema from "../schemas/responseSchemas/formatScoreCardInfoSchema";

async function formatScoreCardInfoValidator(
    data: formatScoreCardInfoIf
): Promise<formatScoreCardInfoIf> {
    try {
        Joi.assert(data, formatScoreCardInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatScoreCardInfoValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatScoreCardInfoValidator;