import { roundTableIf } from "../../../interfaces/roundTableIf";
import Joi from "joi"
import logger from "../../../../logger";
import Errors from "../../../errors"
import roundTableSchema from "../../schemas/methodSchemas/roundTableSchema";

async function roundTableValidator(
    data: roundTableIf
): Promise<roundTableIf> {
    try {
        Joi.assert(data, roundTableSchema);
        return data;
    } catch (error) {
        logger.error('CATCH_ERROR : roundTableValidator :: ', error, '-', data);
        throw new Errors.CancelBattle(error);
    }
}

const exportObject = {
    roundTableValidator,
}

export = exportObject