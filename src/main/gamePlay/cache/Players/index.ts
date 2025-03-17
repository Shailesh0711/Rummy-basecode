import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import redis from "../../../redis";
import Errors from "../../../errors"
import { methodValidator } from "../../../validator";

// playerGamePlay functions
const setPlayerGamePlay = async (
    userId: string,
    tableId: string,
    data: playerPlayingDataIf,
) => {
    try {
          data = await methodValidator.playerGamePlayValidator(data);
        await redis.commands.setValueInKeyWithExpiry(
            `${PREFIX.PLAYER}:${userId}:${tableId}`,
            data,
        );

        return userId;
    } catch (e) {
        console.log(e)
        logger.error(
            `CATCH_ERROR : setPlayerGamePlay :: userId : ${userId} :: tableId : ${tableId} :: `,
            data,
            e,
        );
        throw e;
    }
};

const getPlayerGamePlay = async (
    userId: string,
    tableId: string,
): Promise<playerPlayingDataIf> => {
    try {
        return await redis.commands.getValueFromKey(`${PREFIX.PLAYER}:${userId}:${tableId}`);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : getPlayerGamePlay :: userId : ${userId} :: tableId : ${tableId} :: `,
            e,
        );
        throw new Errors.CancelBattle(e);
    }
};

const removePlayerGameData = async (userId: string, tableId: string) => {
    try {
        return redis.commands.deleteKey(`${PREFIX.PLAYER}:${userId}:${tableId}`);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : removePlayerGameData :: userId : ${userId} :: tableId : ${tableId} :: `,
            e,
        );

        throw new Errors.CancelBattle(e);
    }
};

const exportObject = {
    setPlayerGamePlay,
    getPlayerGamePlay,
    removePlayerGameData,
}

export = exportObject