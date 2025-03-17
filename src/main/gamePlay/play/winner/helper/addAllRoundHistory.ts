import logger from "../../../../../logger";
import { getScoreBoardHistory } from "../../../cache/ScoreBoardHistory";
// import DB from "../../../../db"
import { MONGO } from "../../../../../constants";

export async function addAllRoundHistory(
    tableId: string
) {
    try {

        const scoreBoardData = await getScoreBoardHistory(tableId);

        const resObj = {
            tableId,
            ...scoreBoardData
        }

        if (scoreBoardData) {
            // let trackedHistory = await DB.mongoQuery.add(MONGO.PLAYING_TRACKING_HISTORY, resObj);
            // logger.info(tableId, "setCurrentRoundData :: playingTrackingHistroy :: ", trackedHistory)
        } else {
            logger.warn(`----->> addAllRoundHistory :: history not available ::`)
        }

    } catch (error) {
        logger.info(`--- addAllRoundHistory :: ERROR ::`, error);
        throw error;
    }
}