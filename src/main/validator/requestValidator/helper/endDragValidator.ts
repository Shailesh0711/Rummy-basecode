import { endDragRequestIf } from "../../../interfaces/requestIf";
import Joi from "joi";
import logger from "../../../../logger";
import Errors from "../../../errors";
import { endDragSchema } from "../../schemas/requestSchemas";


async function endDragValidator(
    data: endDragRequestIf
): Promise<endDragRequestIf> {
    try {
        Joi.assert(data, endDragSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : endDragValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = endDragValidator;