import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import { roundHistoryIf } from "../../../interfaces/historyIf";
import redis from "../../../redis";


const getRoundTableHistory = async (
    tableId: string,
): Promise<roundHistoryIf> => {
    return await redis.commands.getValueFromKey(`${PREFIX.ROUND_HISTORY}:${tableId}`)
}

const setRoundTableHistory = async (
    tableId: string,
    value: roundHistoryIf,
) => {
    try {
        const key = `${PREFIX.ROUND_HISTORY}:${tableId}`;
        return await redis.commands.setValueInKeyWithExpiry(key, value);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : setRoundTableHistory :: tableId : ${tableId} `,
            value,
            e,
        );
        throw e;
    }
};

const removeRoundTableHistory = (
    tableId: string,
) => {
    return redis.commands.deleteKey(
        `${PREFIX.ROUND_HISTORY}:${tableId}`,
    );
}

const exportObject = {
    getRoundTableHistory,
    setRoundTableHistory,
    removeRoundTableHistory
}

export = exportObject