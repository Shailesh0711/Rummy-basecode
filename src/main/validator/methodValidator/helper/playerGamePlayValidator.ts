import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import Joi from "joi"
import logger from "../../../../logger";
import Errors from "../../../errors"
import { playerGamePlaySchema } from "../../schemas/methodSchemas";

async function playerGamePlayValidator(
    data: playerPlayingDataIf,
): Promise<playerPlayingDataIf> {
    try {
        Joi.assert(data, playerGamePlaySchema);
        return data;
    } catch (error) {
        logger.error('CATCH_ERROR : playerGamePlayValidator :: ', error, '-', data);
        throw new Errors.CancelBattle(error);
    }
}

export = playerGamePlayValidator