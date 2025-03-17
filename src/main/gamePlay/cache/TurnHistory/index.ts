import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger"
import redis from "../../../redis";
import { turnHistoryIf } from "../../../interfaces/historyIf"


const setTurnHistory = async (
    tableId: string,
    value: turnHistoryIf
) => {
    try {
        await redis.commands.setValueInKeyWithExpiry(`${PREFIX.TURN_HISTORY}:${tableId}`, value);
    } catch (error) {
        logger.error("---setTurnHistory :: ERROR :: ", error)
    }
}

const getTurnHistory = async (
    tableId: string,
): Promise<turnHistoryIf> => {
    try {
        return await redis.commands.getValueFromKey(`${PREFIX.TURN_HISTORY}:${tableId}`)
    } catch (error) {
        logger.error("---getTurnHistory :: ERROR :: ", error)
        throw error;
    }
}

const removeTurnHistoy = async (
    tableId: string,
) => {
    return redis.commands.deleteKey(`${PREFIX.TURN_HISTORY}:${tableId}`)
}

const exportObject = {
    setTurnHistory,
    getTurnHistory,
    removeTurnHistoy
}

export = exportObject;