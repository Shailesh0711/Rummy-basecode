import logger from "../../../../logger";
import { scoreBoardHistoryIf } from "../../../interfaces/historyIf";
import { formatScoreBoardInfoIf } from "../../../interfaces/responseIf";
import { getScoreBoardHistory, setScoreBoardHistory } from "../../cache/ScoreBoardHistory";


async function scoreBoardHistory(
    tableId: string,
    currentRound: number,
    scoreBoardHistory: formatScoreBoardInfoIf,
    userId?: string
): Promise<void> {
    logger.info("------------------->> scoreBoardHistory <<-------------------");
    try {
        if (!userId) {
            let ScoreBoardHistory: scoreBoardHistoryIf = await getScoreBoardHistory(tableId);
            if (!ScoreBoardHistory) {
                ScoreBoardHistory = {};
            }

            if (!ScoreBoardHistory[`Round${currentRound}`]) {
                ScoreBoardHistory[`Round${currentRound}`] = scoreBoardHistory;
            }

            ScoreBoardHistory[`Round${currentRound}`] = scoreBoardHistory;

            await setScoreBoardHistory(tableId, ScoreBoardHistory)
            logger.info("--------->> scoreBoardHistory :: setScoreBoardHistory :: ", setScoreBoardHistory)
        } else {
            let ScoreBoardHistory: scoreBoardHistoryIf = await getScoreBoardHistory(tableId);
            if (!ScoreBoardHistory) {
                ScoreBoardHistory = {};
            }
            if (!ScoreBoardHistory[`${userId}`]) {
                ScoreBoardHistory[`${userId}`] = scoreBoardHistory;
            }
            ScoreBoardHistory[`${userId}`] = scoreBoardHistory;

            await setScoreBoardHistory(userId, ScoreBoardHistory)
        }
    } catch (error) {
        logger.error("---scoreBoardHistory :: ERROR :: " + error);
        throw error;
    }
}

export = scoreBoardHistory;
