import { NUMERICAL } from "../../../constants";
import { PREFIX } from "../../../constants/redis";
import logger from "../../../logger";
import { getTableQueue, setTableQueue } from "../cache/TableQueue";


async function setQueue(
    key: string, tableId: string
): Promise<void> {
    try {
        const newKey = `${PREFIX.QUEUE}:${key}`
        let tables: string[] = await getTableQueue(newKey);

        if (!tables) {
            tables = []
        }

        const tableIdQueue = tables.filter((tID) => {
            return tID === tableId
        });

        if (tableIdQueue.length === NUMERICAL.ZERO) {
            tables.push(tableId)
        } else if (tableIdQueue.length > NUMERICAL.ZERO) {
            for await (const queueId of tableIdQueue) {
                const index = tables.findIndex((tID) => tID === queueId)
                tables.splice(index, 1)
            }
            tables.push(tableId)
        }

        await setTableQueue(newKey, tables)
    } catch (error) {
        logger.error("--- setQueue :: ERROR :: ", error);
        throw error;
    }
}

async function removeQueue(
    key: string,
    tableId: string
): Promise<void> {
    try {
        const newKey = `${PREFIX.QUEUE}:${key}`
        let tables: string[] = await getTableQueue(newKey);

        if(!tables){
            tables = [tableId]
        }

        const tableIdQueue = tables.filter((tID) => {
            return tID === tableId
        });

        if (tableIdQueue.length === NUMERICAL.ONE) {
            const index = tables.findIndex((tID) => tID === tableIdQueue[0])
            tables.splice(index, 1)
        } else {
            for await (const queue of tableIdQueue) {
                const index = tables.findIndex((tID) => tID === queue)
                tables.splice(index, 1)
            }
        }

        await setTableQueue(newKey, tables)
    } catch (error) {
        logger.error("--- removeQueue :: ERROR :: ", error);
        throw error;
    }
}


async function getQueue(
    key: string,
    oldTableIds: string[]
): Promise<null | string> {
    try {
        const newKey = `${PREFIX.QUEUE}:${key}`
        const tables = await getTableQueue(newKey)

        if (
            tables === null ||
            tables === undefined ||
            tables[0] === null ||
            tables[0] === undefined
        ) {
            return null;
        }

        const availbleTables: string[] = [];
        for await (const tableId of tables) {
            let flage = false;
            for await (const tableID of oldTableIds) {
                if (tableId === tableID) {
                    flage = true
                    break;
                }
            }
            if (!flage) {
                availbleTables.push(tableId)
            }
        }


        let newQueueId = "";
        if (availbleTables.length > NUMERICAL.ZERO) {
            newQueueId = availbleTables[NUMERICAL.ZERO]
        }

        if (newQueueId === "") {
            return null;
        } else {
            await removeQueue(key, newQueueId);
            return newQueueId;
        }

    } catch (error) {
        logger.error("--- getQueue :: ERROR :: ", error);
        throw error;
    }
}


const exportObject = {
    setQueue,
    getQueue,
    removeQueue
}

export = exportObject;

