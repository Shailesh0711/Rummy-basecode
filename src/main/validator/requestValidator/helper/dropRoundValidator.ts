
const Joi = require("joi")
import Errors from "../../../errors"
import logger from "../../../../logger";
import { dropRoundRequestIf } from "../../../interfaces/requestIf";
import { dropRoundSchema } from "../../schemas/requestSchemas";

async function dropRoundValidator(
    data: dropRoundRequestIf
): Promise<dropRoundRequestIf> {
    try {
        Joi.assert(data, dropRoundSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : dropRoundValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = dropRoundValidator