import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import { userIf } from "../../../interfaces/userSignUpIf";
import redis from "../../../redis";
import { methodValidator } from "../../../validator"

async function getUser(userId: string): Promise<userIf> {
    try {
        const key = `${PREFIX.USER}:${userId}`
        return await redis.commands.getValueFromKey(key);
    } catch (error) {
        logger.error(`CATCH_ERROR in getUser :: userId : ${userId}`, error);
        throw error;
    }
}

const setUser = async (userId: string, data: userIf) => {
    try {
        const key = `${PREFIX.USER}:${userId}`
        data = await methodValidator.userValidator.userDetailValidator(data)
        await redis.commands.setValueInKeyWithExpiry(key, data);
        return userId;
    } catch (error) {
        logger.error("SET USER :: EROOR ::", error)
        throw error
    }
}


const removeUser = async (userId: string) => {
    try {
        return await redis.commands.deleteKey(`${PREFIX.USER}:${userId}`);
    } catch (e) {
        logger.error(`CATCH_ERROR in removeUser :: userId : ${userId}`, e);
        throw e;
    }
};

const exportObject = {
    getUser,
    setUser,
    removeUser
}

export = exportObject;