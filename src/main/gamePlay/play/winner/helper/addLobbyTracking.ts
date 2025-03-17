import { MONGO } from "../../../../../constants";
import logger from "../../../../../logger";
// import DB from "../../../../db"
import { addLobbyDetailsIf } from "../../../../interfaces/controllersIf";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
// import lobbyValidator from "../../../../validator/lobbyValidator"

export async function addLobbyTracking(
    tableId: string,
    tableData: playingTableIf,
    totalPlayers: number
): Promise<any> {
    try {

        // const findFlageQuery = {
        //     gameId: tableData.gameId,
        // }
        // // const findFlage = await DB.mongoQuery.getOne(MONGO.FLAGE, findFlageQuery)
        // // const findFlage: any = {};
        // // findFlage.isPlayingTracking = true
        // logger.info("addLobbyTracking  :: findFlage :: ", findFlage)
        // if (findFlage && findFlage.isPlayingTracking == true) {

        //     let createdAt = new Date();
        //     const resObj: addLobbyDetailsIf = {
        //         tableId: tableId,
        //         lobbyId: tableData.lobbyId,
        //         entryFee: tableData.bootAmount,
        //         winningAmount: tableData.winPrice,
        //         noOfPlayer: totalPlayers,
        //         totalRound: tableData.totalRounds,
        //         createdAt: createdAt.toLocaleDateString("en-US")
        //     }
        //     const trackLobby = await lobbyValidator.lobbyEntryValidator(resObj);
        //     await DB.mongoQuery.add(MONGO.PLAYING_TRACKING_LOBBY, trackLobby)
        //     logger.info(tableId, "addLobbyTracking : trackLobby ::", trackLobby)
        // } else {
        //     // data not track 
        // }


    } catch (error) {
        logger.error(tableId, 'CATCH_ERROR : getLobbyEntry :>> ', error, ' - ');
    }
}