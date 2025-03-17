import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import { RejoinTableHistoryIf } from "../../../interfaces/playerPlayingTableIf";
import redis from "../../../redis";
import { methodValidator } from "../../../validator";


const getRejoinTableHistory = async (
    userId: string,
    gameId: string,
    lobbyId: string,
): Promise<RejoinTableHistoryIf> => {
    return await redis.commands.getValueFromKey(`${PREFIX.TABLE_HISTORY}:${userId}:${gameId}:${lobbyId}`)
    // return await redis.commands.getValueFromKey(`${PREFIX.TABLE_HISTORY}:${userId}:${gameId}`)
}

const setRejoinTableHistory = async (
    userId: string,
    gameId: string,
    lobbyId: string,
    value: RejoinTableHistoryIf,
) => {
    try {
        value = await methodValidator.rejoinTableHistoryValidator(value);
        // const key = `${PREFIX.TABLE_HISTORY}:${userId}:${gameId}`;
        const key = `${PREFIX.TABLE_HISTORY}:${userId}:${gameId}:${lobbyId}`;
        return await redis.commands.setValueInKeyWithExpiry(key, value);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : setRejoinTableHistory :: userId : ${userId} :: gameId : ${gameId} :: lobbyId : ${lobbyId}`,
            value,
            e,
        );
        throw e;
    }
};

const removeRejoinTableHistory = (
    userId: string,
    gameId: string,
    lobbyId: string,
) => {
    
    logger.info(`------->> removeRejoinTableHistory :: userId : ${userId} :: lobbyId : ${lobbyId} `)
    return redis.commands.deleteKey(
        `${PREFIX.TABLE_HISTORY}:${userId}:${gameId}:${lobbyId}`,
    );
    // return redis.commands.deleteKey(
    //     `${PREFIX.TABLE_HISTORY}:${userId}:${gameId}`,
    // );
}

const exportObject = {
    getRejoinTableHistory,
    setRejoinTableHistory,
    removeRejoinTableHistory
}

export = exportObject