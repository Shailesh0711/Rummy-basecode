import logger from "../../../logger";
import { getPlayerGamePlay, setPlayerGamePlay } from "../cache/Players";


async function playerplayingStatusUpdate(
    tableId: string,
    userIds: string[],
    playingStatus: string,
    isDeclareingState = false
): Promise<void> {
    logger.info("----------------->> PlayerplayingStatusUpdate <<-------------------")
    try {
        for await (let userID of userIds) {

            const playerDetail = await getPlayerGamePlay(userID, tableId);
            
            playerDetail.playingStatus = playingStatus
            playerDetail.isDeclaringState = isDeclareingState ? true : false;
            const promise = await Promise.all([
                setPlayerGamePlay(userID, tableId, playerDetail)
            ])
        }
        logger.info("----->> PlayerplayingStatusUpdate :: update successfully player status")
    } catch (error) {
        logger.error("---playerplayingStatusUpdate :: ERROR :: ", error);
        throw error;
    }
}


export = playerplayingStatusUpdate;