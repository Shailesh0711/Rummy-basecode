import { ERROR_TYPE, MESSAGES, RUMMY_TYPES } from "../../../../constants";
import logger from "../../../../logger";
import { playingTableIf } from "../../../interfaces/playingTableIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData } from "../../cache/Rounds";
import { getTableData, popTableFromQueue } from "../../cache/Tables";
import Errors from "../../../errors";
import { getUser } from "../../cache/User";
import { poolRummyLeaveRoundTable } from "./rummyLeaveRoundTable/poolRummyLeaveRoundTable";
import { pointRummyLeaveRoundTable } from "./rummyLeaveRoundTable/pointRummyLeaveRoundTable";
import { dealRummyLeaveRoundTable } from "./rummyLeaveRoundTable/dealRummyLeaveRoundTable";

export async function leaveRoundTable(
    flag: boolean,
    playerLeave: boolean,
    userId: string,
    tableId: string,
    currentRound: number,
    leaveFlage = false
): Promise<void> {
    logger.info("==================>> LeaveRoundTable <<=======================");
    logger.info(`----------->> leaveRoundTable ::  userId : ${userId} :: tableId :: ${tableId} :: currentRound :: ${currentRound}`);
    try {

        logger.info("----->> leaveRoundTable :: flag ::", flag)
        logger.info("----->> leaveRoundTable :: playerLeave ::", playerLeave)

        const playingTable: playingTableIf = await getTableData(tableId);
        logger.info("----->> leaveRoundTable :: playingTable ::", playingTable);

        if (playingTable === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        if (currentRound !== playingTable.currentRound) {
            return;
        }

        let roundTableData = await getRoundTableData(tableId, currentRound)
        logger.info("----->> leaveRoundTable :: roundTableData ::", roundTableData);

        let playerData = await getPlayerGamePlay(userId, tableId)
        logger.info("----->> leaveRoundTable :: playerData ::", playerData)

        logger.info("----->> leaveRoundTable :: player round game play state  ::", roundTableData.seats[`s${playerData.seatIndex}`].userStatus)

        let userData = await getUser(userId);
        logger.info("----->> leaveRoundTable :: userData", userData);

        if (!userData) throw new Errors.CancelBattle(`User not found`);

        logger.info("----->> leaveRoundTable :: RUMMY_TYPES ::", playingTable.rummyType);

        switch (playingTable.rummyType) {

            case RUMMY_TYPES.POINT_RUMMY:
                await pointRummyLeaveRoundTable(roundTableData, playerData, playingTable, userData, flag, playerLeave, leaveFlage)
                break;

            case RUMMY_TYPES.POOL_RUMMY:
                await poolRummyLeaveRoundTable(roundTableData, playerData, playingTable, userData, flag, playerLeave, leaveFlage)
                break;

            case RUMMY_TYPES.DEALS_RUMMY:
                await dealRummyLeaveRoundTable(roundTableData, playerData, playingTable, userData, flag, playerLeave, leaveFlage)
                break;

            default:
                logger.info("<<====== Default :: leaveRoundTable :: Call ========>>");
                break;
        }

    } catch (error: any) {

        console.log("---leaveRoundTable :: ERROR :: " + error);
        logger.error("---leaveRoundTable :: ERROR :: " + error);

        let nonProdMsg = "";
        if (error && error.type === ERROR_TYPE.LEAVE_TABLE_ERROR) {
            logger.error(
                `--- leaveRoundTable :: ERROR_TYPE :: ${ERROR_TYPE.LEAVE_TABLE_ERROR}::`,
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                `--- leaveRoundTable :: CancelBattle :: ERROR ::`,
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            throw new Errors.CancelBattle(error)
        } else {
            logger.error(
                `--- leaveRoundTable :: commonError :: ERROR ::`,
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            throw error;
        }
    }
}
