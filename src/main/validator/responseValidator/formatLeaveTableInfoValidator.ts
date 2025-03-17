// formatLeaveTableInfoValidator

import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatLeaveTableInfoIf } from "../../interfaces/responseIf";
import { formatLeaveTableInfoSchema } from "../schemas/responseSchemas";

async function formatLeaveTableInfoValidator(
    data: formatLeaveTableInfoIf
): Promise<formatLeaveTableInfoIf> {
    try {
        Joi.assert(data, formatLeaveTableInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatLeaveTableInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = formatLeaveTableInfoValidator;