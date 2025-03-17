import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatNextRoundStartInfoIf } from "../../interfaces/responseIf";
import { formatNextRoundStartInfoSchema } from "../schemas/responseSchemas";

async function formatNextRoundStartInfoValidator(
    data: formatNextRoundStartInfoIf
): Promise<formatNextRoundStartInfoIf> {
    try {
        Joi.assert(data, formatNextRoundStartInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatNextRoundStartInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = formatNextRoundStartInfoValidator;