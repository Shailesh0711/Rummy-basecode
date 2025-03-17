import { playingTableIf } from "../../../interfaces/playingTableIf";
import Joi from "joi"
import logger from "../../../../logger";
import Errors from "../../../errors"
import { playingTableSchema } from "../../schemas/methodSchemas";


async function playingTableValidator(
    data: playingTableIf,
): Promise<playingTableIf> {
    try {
        Joi.assert(data, playingTableSchema);
        return data;
    } catch (error) {
        logger.error('CATCH_ERROR : playingTableValidator :: ', error, '-', data);
        throw new Errors.CancelBattle(error);
    }
}

const exportObject = {
    playingTableValidator
}

export = exportObject