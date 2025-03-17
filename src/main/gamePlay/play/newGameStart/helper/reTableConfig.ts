import { NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { removeTableData } from "../../../cache/Tables";
import { getTableData, setTableData } from "../../../cache/Tables";
const { ObjectID } = require("mongodb")


export async function reTableConfig(
    tableId: string
) {
    try {
        logger.info(`------------------>> reTableConfig <<------------------`)
        const oldTableData = await getTableData(tableId);

        const oldTableLastRound: number = JSON.parse(JSON.stringify(oldTableData.currentRound))

        oldTableData._id = ObjectID().toString();
        oldTableData.currentRound = NUMERICAL.ONE;
        oldTableData.winner = [];

        //create a new table 
        await setTableData(oldTableData)

        logger.info(`------>> reTableConfig :: new table config data :: `, oldTableData)

        // remove old table
        await removeTableData(tableId);

        return {
            newTableId: oldTableData._id,
            dealType: oldTableData.dealType,
            totalPlayers: oldTableData.maximumSeat,
            totalRounds: oldTableLastRound,
            gameId: oldTableData.gameId,
            lobbyId: oldTableData.lobbyId,
            gameType: oldTableData.gameType,
            currentRound: oldTableLastRound,
            minPlayerForPlay: oldTableData.minPlayerForPlay
        }

    } catch (error) {
        console.log("--- reTableConfig :: ERROR :: ", error);
        logger.error("--- reTableConfig :: ERROR :: ", error);
        throw error;
    }
}
