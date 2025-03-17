import config from "../../../../connections/config";
import { GAME_TYPE, NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import { checkUserBlockStatus } from "../../../clientsideapi/checkUserBlockStatus";
import { blockUserCheckI } from "../../../interfaces/controllersIf";
import { userIf } from "../../../interfaces/userSignUpIf";
import { getRoundTableData } from "../../cache/Rounds";
import { getTableData } from "../../cache/Tables";
import { pushBlockTableForUser } from "../../utils/blockTableForUser";
import { getQueue, setQueue } from "../../utils/manageQueue";
import { createTable, setupRound } from "../insertPlayer/comman";

export async function blockUserCheck(
    tableId: string,
    userData: userIf,
    queueKey: string,
): Promise<blockUserCheckI> {

    //block User Check fetures
    try {
        const tableData = await getTableData(tableId);
        if (!tableData) {
            const blockTables = await pushBlockTableForUser(userData.userId, tableId)
            const newTableId = await getQueue(queueKey, blockTables);
            if (!newTableId) {
                const createNewTableId = await createTable(userData);

                await setupRound({
                    tableId: createNewTableId,
                    roundNo: NUMERICAL.ONE,
                    totalPlayers: userData.maximumSeat,
                    dealType: userData.dealType,
                    rummyType : userData.rummyType
                });
                return { tableId: createNewTableId, isNewTableCreated: true }
            } else {
                return await blockUserCheck(newTableId, userData, queueKey)
            }
        } else {

            const roundTableData = await getRoundTableData(tableId, NUMERICAL.ONE)
            let activePlayerUserIdArray: string[] = [];

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                    activePlayerUserIdArray.push(roundTableData.seats[seat].userId);
                }
            }

            if (activePlayerUserIdArray.length != NUMERICAL.ZERO) {
                let isUserBlock = await checkUserBlockStatus(activePlayerUserIdArray, userData.authToken, userData.socketId, tableId);

                logger.info(tableId, "isUserBlock ::>>>>", isUserBlock);

                if (isUserBlock) {
                    // add that tableId in queue
                    await setQueue(queueKey, tableId);
                    // block table Table
                    const blockTables = await pushBlockTableForUser(userData.userId, tableId)
                    const newTableId = await getQueue(queueKey, blockTables);
                    if (!newTableId) {
                        const createNewTableId = await createTable(userData);

                        await setupRound({
                            tableId: createNewTableId,
                            roundNo: NUMERICAL.ONE,
                            totalPlayers: userData.maximumSeat,
                            dealType: userData.dealType,
                            rummyType : userData.rummyType
                        });

                        return { tableId: createNewTableId, isNewTableCreated: true }
                    } else {
                        // call this function
                        return await blockUserCheck(newTableId, userData, queueKey)
                    }

                } else {
                    logger.info(tableId, "not a blocking user");
                    return { tableId: tableId, isNewTableCreated: false }
                }
            } else {
                return { tableId: tableId, isNewTableCreated: false }
            }
        }
    } catch (error: any) {
        logger.info(tableId, " blockUserCheck() :: ERROR ==>>", error);
        throw error;
    }

}
