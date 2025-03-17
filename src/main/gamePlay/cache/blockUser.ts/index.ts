import redis from "../../../redis";
import Errors from "../../../errors"
import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";


// playerGamePlay functions
const setBlockUser = async (
    key: string,
    data: string[]
) => {
    try {
        await redis.commands.setValueInKeyWithExpiry(
            key,
            data,
        );

    } catch (e) {
        console.log(e)
        logger.error(
            `CATCH_ERROR : setPlayerGamePlay :: key : ${key} `,
            data,
            e,
        );
        throw e;
    }
};

const getBlockUser = async (
    key: string,
): Promise<string[]> => {
    try {
        return await redis.commands.getValueFromKey(key);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : getPlayerGamePlay :: key : ${key} `,
            e,
        );
        throw new Errors.CancelBattle(e);
    }
};

const removeBlockUser = async (
    key: string,
) => {
    try {
        return redis.commands.deleteKey(key);
    } catch (e) {
        logger.error(
            `CATCH_ERROR : removePlayerGameData :: key : ${key}  `,
            e,
        );

        throw new Errors.CancelBattle(e);
    }
};

const exportObject = {
    setBlockUser,
    getBlockUser,
    removeBlockUser
}

export = exportObject;