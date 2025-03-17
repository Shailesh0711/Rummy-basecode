import logger from "../../../logger";
import Errors from "../../errors"
import Joi from "joi"
import { formatSettingMenuTableInfo } from "../../interfaces/responseIf";
import { formatSettingMenuTableInfoSchema } from "../schemas/responseSchemas";


async function formatSettingMenuTableInfoValidator(
    data: formatSettingMenuTableInfo
): Promise<formatSettingMenuTableInfo> {
    try {
        Joi.assert(data, formatSettingMenuTableInfoSchema);
        return data
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatSettingMenuTableInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatSettingMenuTableInfoValidator;