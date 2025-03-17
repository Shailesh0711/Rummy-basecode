import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatSplitDeclareInfoIf } from "../../interfaces/responseIf";
import { formatSplitDeclareInfoSchema } from "../schemas/responseSchemas";


async function formatSplitDeclareInfoValidator(
    data: formatSplitDeclareInfoIf
    ): Promise<formatSplitDeclareInfoIf> {
        try {
            Joi.assert(data, formatSplitDeclareInfoSchema);
            return data;
        } catch (error) {
            logger.error(
                'CATCH_ERROR : formatSplitDeclareInfoValidator :: ',
                error,
                ' - ',
                data,
            );
            throw new Errors.CancelBattle(error);
        } 
}

export = formatSplitDeclareInfoValidator;