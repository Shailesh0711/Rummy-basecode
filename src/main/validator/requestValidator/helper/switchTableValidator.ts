import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { switchEventRequestIf } from "../../../interfaces/requestIf";
import { switchTableSchema } from "../../schemas/requestSchemas";

async function switchTableValidator(
    data: switchEventRequestIf
): Promise<switchEventRequestIf> {
    try {
        Joi.assert(data, switchTableSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : switchTableValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = switchTableValidator;