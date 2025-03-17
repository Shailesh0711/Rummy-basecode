import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { pickupCardFromCloseDeckRequestIf } from "../../../interfaces/requestIf";
import { pickUpCardFromCloseDeckSchema } from "../../schemas/requestSchemas";

async function pickUpCardFromCloseDeckValidator(
    data: pickupCardFromCloseDeckRequestIf
): Promise<pickupCardFromCloseDeckRequestIf> {
    try {
        Joi.assert(data, pickUpCardFromCloseDeckSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : pickUpCardFromCloseDeckValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = pickUpCardFromCloseDeckValidator;