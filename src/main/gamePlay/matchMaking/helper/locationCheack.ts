import { GAME_TYPE, NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import { userIf } from "../../../interfaces/userSignUpIf";
import { getRoundTableData } from "../../cache/Rounds";
import { getTableData } from "../../cache/Tables";
import { getUser } from "../../cache/User";
import { pushBlockTableForUser } from "../../utils/blockTableForUser";
import { getQueue, setQueue } from "../../utils/manageQueue";
import { createTable, setupRound } from "../insertPlayer/comman";
import { blockUserCheck } from "./blockUserCheck";
import disctanceCalculation from "./disctanceCalculation";



export async function locationDistanceCheck(
    tableId: string,
    userData: userIf,
    queueKey: string,
    rediusRange: number,
): Promise<string> {
    try {
        const tableData = await getTableData(tableId);

        if (!tableData) {
            const blockUserData = await blockUserCheck(tableId, userData, queueKey);
            if (blockUserData.isNewTableCreated) {
                return blockUserData.tableId
            } else {
                return await locationDistanceCheck(blockUserData.tableId, userData, queueKey, rediusRange);
            }
        } else {

            const { latitude, longitude } = userData.location;
            const roundTableData = await getRoundTableData(tableId, NUMERICAL.ONE)
            let activePlayerUserIdArray: string[] = [];

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                    activePlayerUserIdArray.push(roundTableData.seats[seat].userId);
                }
            }

            for await (const userId of activePlayerUserIdArray) {
                const getUserData = await getUser(userId);
                if (!getUserData) throw new Error('Unable to get user data')

                let distanceFind: number = disctanceCalculation(Number(latitude), Number(longitude), Number(getUserData.location.latitude), Number(getUserData.location.longitude));
                logger.info(tableId, "distanceFind ::>>> ", distanceFind);

                let rangeRediusCheck = rediusRange;
                logger.info(tableId, 'range :=>>> ', rangeRediusCheck);

                if (distanceFind < rangeRediusCheck) {
                    await setQueue(queueKey, tableId);
                    const blockTables = await pushBlockTableForUser(userData.userId, tableId);
                    const newTableId = await getQueue(queueKey, blockTables);

                    if (!newTableId) {
                        const createNewTableId = await createTable(userData);

                        await setupRound({
                            tableId: createNewTableId,
                            roundNo: NUMERICAL.ONE,
                            totalPlayers: userData.maximumSeat,
                            dealType : userData.dealType,
                            rummyType : userData.rummyType
                        });
                        return createNewTableId
                    } else {
                        const blockUserData = await blockUserCheck(newTableId, userData, queueKey);
                        if (blockUserData.isNewTableCreated) {
                            return blockUserData.tableId
                        } else {
                            return await locationDistanceCheck(blockUserData.tableId, userData, queueKey, rediusRange);
                        }
                    }

                }
            }
            return tableId;
        }

    } catch (error) {
        logger.error(`----->> locationDistanceCheck :: ERROR :: `, error);
        throw error;
    }
}