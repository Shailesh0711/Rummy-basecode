import logger from "../../../../logger";
import Joi from "joi"
import Errors from "../../../errors";
import { scoreBoardSchema } from "../../schemas/requestSchemas";
import { viewScoreBoardRequestIf } from "../../../interfaces/requestIf";

async function scoreBoardValidator(
    data: viewScoreBoardRequestIf
): Promise<viewScoreBoardRequestIf> {
    try {
        Joi.assert(data,scoreBoardSchema);
        return data
    } catch (error: any) {
        logger.error('CATCH_ERROR : scoreBoardValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

export = scoreBoardValidator;
