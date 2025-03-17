import { formatGameTableInfoIf } from "../../interfaces/responseIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatGameTableInfoSchema } from "../schemas/responseSchemas";

async function formatGameTableInfoValidator(
    data: formatGameTableInfoIf,
): Promise<formatGameTableInfoIf> {
    try {
        Joi.assert(data, formatGameTableInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatGameTableInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatGameTableInfoValidator