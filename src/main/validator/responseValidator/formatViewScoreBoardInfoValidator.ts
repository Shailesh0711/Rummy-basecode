import { formatViewScoreBoardInfoif } from "../../interfaces/responseIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatViewScoreBoardInfoSchema } from "../schemas/responseSchemas";

async function formatViewScoreBoardInfoValidator(
    data: formatViewScoreBoardInfoif
): Promise<formatViewScoreBoardInfoif> {
    try {
        Joi.assert(data, formatViewScoreBoardInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatViewScoreBoardInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatViewScoreBoardInfoValidator;