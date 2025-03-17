import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatDropRoundInfoIf } from "../../interfaces/responseIf";
import { formatDropRoundInfoSchema } from "../schemas/responseSchemas";

async function formatDropRoundInfoValidator(
    data: formatDropRoundInfoIf,
): Promise<formatDropRoundInfoIf> {
    try {
        Joi.assert(data, formatDropRoundInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatDropRoundInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatDropRoundInfoValidator