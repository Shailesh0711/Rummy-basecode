import redis from "../../../redis";
import Errors from "../../../errors"
import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";


// playerGamePlay functions
const setLobbyHistory = async (
    userId: string,
    data: string[]
) => {
    try {
        await redis.commands.setValueInKeyWithExpiry(
            `${PREFIX.LOBBY_HISTORY}:${userId}`,
            data,
        );

        return userId;
    } catch (e) {
        console.log(e)
        logger.error(
            `CATCH_ERROR : setPlayerGamePlay :: userId : ${userId} `,
            data,
            e,
        );
        throw e;
    }
};

const getLobbyHistory = async (
    userId: string,
): Promise<string[]> => {
    try {
        return await redis.commands.getValueFromKey(`${PREFIX.LOBBY_HISTORY}:${userId}`);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : getPlayerGamePlay :: userId : ${userId} `,
            e,
        );
        throw new Errors.CancelBattle(e);
    }
};

const removeLobbyHistory = async (
    userId: string,
) => {
    try {
        return redis.commands.deleteKey(`${PREFIX.LOBBY_HISTORY}:${userId}`);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : removePlayerGameData :: userId : ${userId}  `,
            e,
        );

        throw new Errors.CancelBattle(e);
    }
};

const exportObject = {
    setLobbyHistory,
    getLobbyHistory,
    removeLobbyHistory
}

export = exportObject;