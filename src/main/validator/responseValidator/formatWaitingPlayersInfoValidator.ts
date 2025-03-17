import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatWaitingPlayersInfoIf } from "../../interfaces/responseIf";
import { formatWaitingPlayersInfoSchema } from "../schemas/responseSchemas";

async function formatWaitingPlayersInfoValidator(
    data: formatWaitingPlayersInfoIf
): Promise<formatWaitingPlayersInfoIf> {
    try {
        Joi.assert(data, formatWaitingPlayersInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatWaitingPlayersInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatWaitingPlayersInfoValidator;