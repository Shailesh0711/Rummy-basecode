import logger from "../../../logger";
import { getBlockUser, removeBlockUser, setBlockUser } from "../cache/blockUser.ts"




export async function pushBlockTableForUser(
    userId: string,
    tableId: string
): Promise<string[]> {
    try {
        const blockTableUserQueue = `BlockTable:${userId}`

        let blockTables: string[] = await getBlockUser(blockTableUserQueue);;

        if (!blockTables) {
            blockTables = [];
        }

        blockTables.push(tableId)

        await setBlockUser(blockTableUserQueue, blockTables);

        return blockTables;
    } catch (error) {
        logger.info(`---- pushBlockTableForUser :: ERROR :: `, error)
        throw error;
    }
}

export async function removeBlockuserAllTableQueue(
    userId: string,
) {
    try {
        const blockTableUserQueue = `BlockTable:${userId}`

        await removeBlockUser(blockTableUserQueue);
    } catch (error) {
        logger.error(`--- removeBlockTableForUser :: ERROR :: `, error);
        throw error;
    }
}