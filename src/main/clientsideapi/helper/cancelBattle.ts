import logger from "../../../logger";
import { getTableData, removeTableData } from "../../gamePlay/cache/Tables";
import Errors from "../../errors";
import { getRoundTableData, removeRoundTableData } from "../../gamePlay/cache/Rounds";
import { NUMERICAL } from "../../../constants";
import { removeRejoinTableHistory } from "../../gamePlay/cache/TableHistory";
import { removePlayerGameData } from "../../gamePlay/cache/Players";
import { removeTurnHistoy } from "../../gamePlay/cache/TurnHistory";
import { removeRoundTableHistory } from "../../gamePlay/cache/RoundHistory";
import { removeScoreBoardHistory } from "../../gamePlay/cache/ScoreBoardHistory";
import cancelAllTimers from "../../gamePlay/play/winner/helper/cancelTimers";

export async function cancelBattle(
    tableId: string
) {
    try {
        const tableData = await getTableData(tableId);
        logger.info("------>> cancelBattle :: tableData :: ", tableData);
        
        const roundTableData = await getRoundTableData(tableId, tableData.currentRound);
        logger.info("------>> cancelBattle :: roundTableData :: ", roundTableData);
        
        await cancelAllTimers(tableId, roundTableData.seats,true);
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                await removeRejoinTableHistory(roundTableData.seats[seat].userId, tableData.gameId, tableData.lobbyId);
                await removePlayerGameData(roundTableData.seats[seat].userId, tableId)
            }
        }

        for (let i = NUMERICAL.ONE; i <= tableData.currentRound; i++) {
            await removeRoundTableData(tableId, i)
        }

        await removeTableData(tableId);
        await removeTurnHistoy(tableId);
        await removeRoundTableHistory(tableId);
        await removeScoreBoardHistory(tableId);

    } catch (error) {
        logger.info("========= cancelBattle :: Function :: ", error);
        throw new Errors.CancelBattle("get multi Player Deduct Entry Fee fail");
    }
}