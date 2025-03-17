import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import { scoreBoardHistoryIf } from "../../../interfaces/historyIf";
import redis from "../../../redis";


const getScoreBoardHistory = async (
    tableId: string,
): Promise<scoreBoardHistoryIf> => {
    return await redis.commands.getValueFromKey(`${PREFIX.SCORE_BOARD_HISTORY}:${tableId}`)
}

const setScoreBoardHistory = async (
    tableId: string,
    value: scoreBoardHistoryIf,
) => {
    try {
        const key = `${PREFIX.SCORE_BOARD_HISTORY}:${tableId}`;
        return await redis.commands.setValueInKeyWithExpiry(key, value);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : setScoreBoardHistory :: tableId : ${tableId} `,
            value,
            e,
        );
        throw e;
    }
};

const removeScoreBoardHistory = (
    tableId: string,
) => {
    return redis.commands.deleteKey(
        `${PREFIX.SCORE_BOARD_HISTORY}:${tableId}`,
    );
}

const exportObject = {
    getScoreBoardHistory,
    setScoreBoardHistory,
    removeScoreBoardHistory,
}

export = exportObject