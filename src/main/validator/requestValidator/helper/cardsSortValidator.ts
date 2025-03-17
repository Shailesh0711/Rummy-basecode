
const Joi = require("joi")
import Errors from "../../../errors"
import logger from "../../../../logger";
import { requestSchemas } from "../../schemas";
import { cardsSortRequestIf } from "../../../interfaces/requestIf";
import { cardsSortSchema } from "../../schemas/requestSchemas";

async function cardsSortValidator(
    data: cardsSortRequestIf
): Promise<cardsSortRequestIf> {
    try {
        Joi.assert(data, cardsSortSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : cardsSortValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = cardsSortValidator