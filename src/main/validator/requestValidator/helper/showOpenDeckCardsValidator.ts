import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { showOpenDeckCardsrequestIf } from "../../../interfaces/requestIf";
import { showOpenDeckCardsSchema } from "../../schemas/requestSchemas";

async function showOpenDeckCardsValidator(
    data: showOpenDeckCardsrequestIf
): Promise<showOpenDeckCardsrequestIf> {
    try {
        Joi.assert(data,showOpenDeckCardsSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : showOpenDeckCardsValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = showOpenDeckCardsValidator;