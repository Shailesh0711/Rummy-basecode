import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import redis from "../../../redis";
import Errors from "../../../errors"
import { playingTableIf } from "../../../interfaces/playingTableIf";
import { methodValidator } from "../../../validator";

const setTableData = async (
    data: playingTableIf
) => {
    try {
        data = await methodValidator.playingTableValidator.playingTableValidator(data);
        const { _id: tableId } = data;
        const key = `${PREFIX.GAME_TABLE}:${tableId}`;
        await redis.commands.setValueInKeyWithExpiry(key, data);

        return tableId;
    } catch (error) {
        logger.error(
            `SET TABLE DATA :: ERROR :: TABLEID : ${data._id} :: `,
            data,
            error,
        );
        throw new Errors.CancelBattle(error);
    }
};

const getTableData = async (
    tableId: string
): Promise<playingTableIf> => {
    try {
        return await redis.commands.getValueFromKey(`${PREFIX.GAME_TABLE}:${tableId}`);
    } catch (e) {
        logger.error(`GET TABLE DATA:: ERROR :: TABLEID : ${tableId} :: `, e);
        throw new Errors.CancelBattle(e);
    }
};

const removeTableData = async (tableId: string) => {
    return await redis.commands.deleteKey(`${PREFIX.GAME_TABLE}:${tableId}`);
}

const pushTableInQueue = async (key: string, data: any) => {
    return await redis.commands.pushIntoQueue(key, data);
}

const popTableFromQueue = async (key: string) => {
    return await redis.commands.popFromQueue(key);
}


const exportObject = {
    setTableData,
    getTableData,
    removeTableData,
    pushTableInQueue,
    popTableFromQueue
}



export = exportObject