import { settingManuTableInfoHandlerIF } from "../../../interfaces/requestIf";
import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { settingManuTableInfoSchema } from "../../schemas/requestSchemas";

async function settingManuTableInfoValidator(
    data: settingManuTableInfoHandlerIF
): Promise<settingManuTableInfoHandlerIF> {
    try {
        Joi.assert(data, settingManuTableInfoSchema);
        return data
    } catch (error) {
        logger.error('CATCH_ERROR : settingManuTableInfoValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = settingManuTableInfoValidator;