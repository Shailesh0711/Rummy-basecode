import { formateDeclareInfoIf } from "../../interfaces/responseIf";
import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formateDeclareInfoSchema } from "../schemas/responseSchemas";

async function formateDeclareInfoValidator(
    data: formateDeclareInfoIf
): Promise<formateDeclareInfoIf> {
    try {
        Joi.assert(data, formateDeclareInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formateDeclareInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formateDeclareInfoValidator;