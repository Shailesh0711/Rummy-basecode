import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { pickUpCardFromOpenDeckSchema } from "../../schemas/requestSchemas";
import { pickUpCardFromOpenDecRequestIf } from "../../../interfaces/requestIf";

async function pickUpCardFromOpenDeckValidator(
    data: pickUpCardFromOpenDecRequestIf
): Promise<pickUpCardFromOpenDecRequestIf> {
    try {
        Joi.assert(data, pickUpCardFromOpenDeckSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : pickUpCardFromOpenDeckValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = pickUpCardFromOpenDeckValidator;
