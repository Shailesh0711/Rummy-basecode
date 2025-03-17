import { PREFIX } from "../../../../constants/redis";
import redis from "../../../redis";
import Errors from "../../../errors"
import logger from "../../../../logger";
import { methodValidator } from "../../../validator";

const setTableQueue = async (
    key: string,
    data: string[]
) => {
    try {
        data = await methodValidator.setTableQueueValidator(data);
        await redis.commands.setValueInKeyWithExpiry(key, data);
    } catch (error) {
        logger.error(
            `--- setTableQueue :: quequeKey :: ${key} :: data :: ${data}`,
            data,
            error,
        );
        throw new Errors.CancelBattle(error);
    }
};

const getTableQueue = async (
    key: string
): Promise<any> => {
    try {
        return await redis.commands.getValueFromKey(key);
    } catch (error) {
        logger.error(`--- getTableQueue :: TABLE Queue : ${key} :: `, error);
        throw new Errors.CancelBattle(error);
    }
};

const removeTableQueue = async (key: string) => {
    return await redis.commands.deleteKey(key);
}

const exportObject = {
    setTableQueue,
    getTableQueue,
    removeTableQueue
}

export = exportObject;