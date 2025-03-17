import { playarDetail } from "../../interfaces/responseIf";
import Joi from "joi"
import Errors from "../../errors";
import logger from "../../../logger";
import { formatJoinTableInfoSchema } from "../schemas/responseSchemas";

async function formatJoinTableInfoValidator(
    data: playarDetail,
): Promise<playarDetail> {
    try {
        Joi.assert(data, formatJoinTableInfoSchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatJoinTableInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        console.log(error)
        throw new Errors.CancelBattle(error);
    }
}

export = formatJoinTableInfoValidator