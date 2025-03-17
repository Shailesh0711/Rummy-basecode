import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { rejoinGameAgainReqIf } from "../../../interfaces/requestIf";
import { rejoinGameAgainSchema } from "../../schemas/requestSchemas";

async function rejoinGameAgainValidator(
    data: rejoinGameAgainReqIf
): Promise<rejoinGameAgainReqIf> {
    try {
        Joi.assert(data,rejoinGameAgainSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : rejoinGameAgainValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = rejoinGameAgainValidator;
