import { leaveTableEventRequestIf } from "../../../interfaces/requestIf";
import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { leaveTableEventSchema } from "../../schemas/requestSchemas";

async function leaveTableEventValidator(
    data: leaveTableEventRequestIf
): Promise<leaveTableEventRequestIf> {
    try {
        Joi.assert(data, leaveTableEventSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : leaveTableEventValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = leaveTableEventValidator;