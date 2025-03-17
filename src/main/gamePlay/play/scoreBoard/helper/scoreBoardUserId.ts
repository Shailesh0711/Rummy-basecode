import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { getRoundTableData } from "../../../cache/Rounds";


async function scoreBoardUserId(
    tableId: string,
    currentRound: number,
): Promise<string[]> {
    logger.info("----------------->> scoreBoardUserId <<------------")
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);

        const userIds: string[] = [];
        
        for await (const key of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[key]).length > NUMERICAL.ONE) {
                userIds.push(roundTableData.seats[key].userId);
            }
        }
        logger.info("------>> scoreBoardUserId :: userIds :: ", userIds)
        return userIds;
    } catch (error) {
        logger.error("---scoreBoardUserId :: ERROR: " + error)
        throw error;
    }
}

export = scoreBoardUserId;