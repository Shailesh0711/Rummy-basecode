import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatLostEventInfoIf } from "../../interfaces/responseIf";
import { formatLostEventInfoSchema } from "../schemas/responseSchemas";

async function formatLostEventInfoValidator(
    data: formatLostEventInfoIf
): Promise<formatLostEventInfoIf> {
    try {
        Joi.assert(data, formatLostEventInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatLostEventInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = formatLostEventInfoValidator;