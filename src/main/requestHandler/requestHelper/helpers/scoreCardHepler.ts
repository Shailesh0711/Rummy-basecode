import { MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES } from "../../../../constants";
import logger from "../../../../logger";
import { scoreBoardHistoryIf } from "../../../interfaces/historyIf";


export async function showStatusOrScore(
    scoreBoardData: scoreBoardHistoryIf,
    scoreBoardCount: number,
    userId: string,
    rummyType: string,
    isRecursion = false
): Promise<number | string> {
    try {

        const roundScoreBoard = scoreBoardData[`Round${scoreBoardCount}`];

        logger.info("----------->> showStatusOrScore :: roundScoreBoard :: ", roundScoreBoard);
        logger.info("----------->> showStatusOrScore :: userId :: ", userId);
        logger.info("----------->> showStatusOrScore :: scoreBoardCount :: ", scoreBoardCount);

        if (roundScoreBoard) {
            let objUserIndex: number = NUMERICAL.MINUS_ONE;
            let countIndex: number = NUMERICAL.ZERO
            for await (const userScoreBoard of roundScoreBoard.scoreBoradTable) {
                if (userScoreBoard.userId === userId) {
                    objUserIndex = countIndex
                    break;
                }
                countIndex += NUMERICAL.ONE;
            }
            console.log("----------->> showStatusOrScore :: objUserIndex :: ", objUserIndex);
            if (objUserIndex === NUMERICAL.MINUS_ONE) {
                const newScoreBoardCount = scoreBoardCount - NUMERICAL.ONE
                if (newScoreBoardCount === NUMERICAL.ZERO) {
                    return "-"
                } else {
                    return await showStatusOrScore(scoreBoardData, newScoreBoardCount, userId, rummyType, true)
                }
            } else {
                let userScore: string | number = "";

                if (rummyType === RUMMY_TYPES.DEALS_RUMMY) {

                    if (isRecursion) {
                        userScore = roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status === PLAYER_STATE.LEFT ?
                            PLAYER_STATE.LEFT : roundScoreBoard.scoreBoradTable[objUserIndex] && typeof roundScoreBoard.scoreBoradTable[objUserIndex].DealScore === "number" ?
                                roundScoreBoard.scoreBoradTable[objUserIndex].DealScore : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status ?
                                    roundScoreBoard.scoreBoradTable[objUserIndex].Status : "";

                    } else {
                        userScore = roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex] && typeof roundScoreBoard.scoreBoradTable[objUserIndex].DealScore === "number" ?
                            roundScoreBoard.scoreBoradTable[objUserIndex].DealScore : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status === PLAYER_STATE.LEFT ?
                                PLAYER_STATE.LEFT : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status ?
                                    roundScoreBoard.scoreBoradTable[objUserIndex].Status : "";
                    }
                } else if (rummyType === RUMMY_TYPES.POOL_RUMMY) {
                    if (isRecursion) {
                        userScore = roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].message === MESSAGES.MESSAGE.REJOIN_AGAIN_GAME ?
                            MESSAGES.MESSAGE.REJOIN_AGAIN_GAME : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].message === MESSAGES.MESSAGE.Eliminated ?
                                "Eliminated" : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status === PLAYER_STATE.LEFT ?
                                    PLAYER_STATE.LEFT : roundScoreBoard.scoreBoradTable[objUserIndex] && typeof roundScoreBoard.scoreBoradTable[objUserIndex].DealScore === "number" ?
                                        roundScoreBoard.scoreBoradTable[objUserIndex].DealScore : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status ?
                                            roundScoreBoard.scoreBoradTable[objUserIndex].Status : "";

                    } else {
                        userScore = roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].message === MESSAGES.MESSAGE.REJOIN_AGAIN_GAME ?
                            MESSAGES.MESSAGE.REJOIN_AGAIN_GAME : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex] && typeof roundScoreBoard.scoreBoradTable[objUserIndex].DealScore === "number" ?
                                roundScoreBoard.scoreBoradTable[objUserIndex].DealScore : roundScoreBoard.scoreBoradTable[objUserIndex].message === MESSAGES.MESSAGE.Eliminated ?
                                    "Eliminated" : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status === PLAYER_STATE.LEFT ?
                                        PLAYER_STATE.LEFT : roundScoreBoard.scoreBoradTable[objUserIndex] && roundScoreBoard.scoreBoradTable[objUserIndex].Status ?
                                            roundScoreBoard.scoreBoradTable[objUserIndex].Status : "";
                    }
                }

                logger.info("----------->> showStatusOrScore :: userScore :: ", userScore);
                logger.info("----------->> showStatusOrScore :: roundScoreBoard.scoreBoradTable[objUserIndex].DealScore :: ", roundScoreBoard.scoreBoradTable[objUserIndex].DealScore);

                if (userScore === "") {
                    const newScoreBoardCount = scoreBoardCount - NUMERICAL.ONE
                    if (newScoreBoardCount === NUMERICAL.ZERO) {
                        return "-"
                    } else {
                        return await showStatusOrScore(scoreBoardData, newScoreBoardCount, userId, rummyType, true)
                    }
                } else {
                    return userScore
                }
            }
        } else {
            return "-"
        }
    } catch (error) {
        logger.error(`--- showStatusOrScore :: ERROR :: `, error);
        throw error;
    }
}