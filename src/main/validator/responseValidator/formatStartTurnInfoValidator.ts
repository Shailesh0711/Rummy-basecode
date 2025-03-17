import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatStartTurnInfoIf } from "../../interfaces/responseIf";
import { formatStartTurnInfoSchema } from "../schemas/responseSchemas";



async function formatStartTurnInfoValidator(
    data: formatStartTurnInfoIf
): Promise<formatStartTurnInfoIf> {
    try {
        Joi.assert(data, formatStartTurnInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatStartTurnInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = formatStartTurnInfoValidator;