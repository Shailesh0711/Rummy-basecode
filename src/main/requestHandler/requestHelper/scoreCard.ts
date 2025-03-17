import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";
import { getScoreBoardHistory } from "../../gamePlay/cache/ScoreBoardHistory";
import { formatScoreCardInfo } from "../../gamePlay/formatResponse";
import { scoreBoardHistoryIf } from "../../interfaces/historyIf";
import { scoreCardHandlerReqIf } from "../../interfaces/requestIf";
import { formatScoreBoardInfoIf } from "../../interfaces/responseIf";
import { ScoreObjIf } from "../../interfaces/scoreBoardIf";
import { requestValidator } from "../../validator";
import { showStatusOrScore } from "./helpers/scoreCardHepler";

async function scoreCard(
    { data }: scoreCardHandlerReqIf,
    socket: any,
    ack?: Function
) {
    logger.info("========================>> scoreCard <<===========================")
    try {

        data = await requestValidator.scoreCardValidator(data);
        logger.info("----->> scoreCard :: data :: ", data);
        logger.info("----->> scoreCard :: socket currentRound :: ", socket.eventMetaData.currentRound);

        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;
        const poolType = socket.eventMetaData.poolType
        const scoreObj: ScoreObjIf = {
            usersId: [],
            score: [],
            userName: [],
            totalScore: []
        }
        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("----->> scoreCard :: roundTableData :: ", roundTableData);

        if (roundTableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {
            if (roundTableData && roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {

                if (currentRound === NUMERICAL.ONE) {
                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            message: MESSAGES.POPUP.MIDDLE_TOAST_POP.VIEW_SCORE_BOARD_MESSAGE,
                        }
                    });
                } else {
                    const scoreBoardData: scoreBoardHistoryIf = await getScoreBoardHistory(tableId);

                    logger.info("------->> scoreCard :: scoreBoardData :: ", scoreBoardData)

                    let count: number = NUMERICAL.ZERO
                    let scoreBoardCount: number = NUMERICAL.ONE;

                    for await (const scoreBoardRoundKey of Object.keys(scoreBoardData)) {
                        const roundScoreBoard: formatScoreBoardInfoIf = scoreBoardData[scoreBoardRoundKey];
                        logger.info("------->> scoreCard :: roundScoreBoard :: ", roundScoreBoard);

                        if (count === NUMERICAL.ZERO) {
                            scoreObj.score[count] = [];
                            for await (const userScoreData of roundScoreBoard.scoreBoradTable) {
                                scoreObj.usersId.push(userScoreData.userId)
                                scoreObj.userName.push(userScoreData.userName)

                                let dealScore = userScoreData.message === MESSAGES.MESSAGE.REJOIN_AGAIN_GAME ?
                                    MESSAGES.MESSAGE.REJOIN_AGAIN_GAME : userScoreData.Status === PLAYER_STATE.LEFT ?
                                        PLAYER_STATE.LEFT : userScoreData.DealScore;
                                scoreObj.score[count].push(dealScore);
                            }
                        } else {
                            scoreObj.score[count] = [];

                            let objUserIndex = NUMERICAL.ZERO
                            for (const userID of scoreObj.usersId) {
                                let userScore = await showStatusOrScore(scoreBoardData, scoreBoardCount, userID, roundTableData.rummyType);
                                logger.info("------->> scoreCard :: userScore :: ", userScore);
                                logger.info("------->> scoreCard :: objUserIndex :: ", objUserIndex);
                                scoreObj.score[count].splice(objUserIndex, NUMERICAL.ZERO, userScore)
                                objUserIndex += NUMERICAL.ONE;
                            }

                        }
                        count += NUMERICAL.ONE;
                        scoreBoardCount += NUMERICAL.ONE;
                    }
                }
                logger.info("----------->> scoreCard :: scoreObj :: 1 ::", scoreObj);

                for (let i = NUMERICAL.ZERO; i < scoreObj.usersId.length; i++) {
                    let totalUserScore: number = NUMERICAL.ZERO;
                    for (let j = NUMERICAL.ZERO; j < scoreObj.score.length; j++) {
                        totalUserScore += typeof scoreObj.score[j][i] === "number" ?
                            Number(scoreObj.score[j][i]) : NUMERICAL.ZERO;
                    }
                    scoreObj.totalScore.push(totalUserScore)
                }
                logger.info("----------->> scoreCard :: scoreObj :: 1 ::", scoreObj);

                const formatedRes = await formatScoreCardInfo(scoreObj, userId, poolType);
                logger.info("----->> scoreCard :: formatedRes :: ", formatedRes);

                commonEventEmitter.emit(EVENTS.SCORE_CARD, {
                    socket,
                    data: formatedRes
                })

            }
        }

    } catch (error) {
        logger.info(`---- scoreCard :: ERROR :: `, error);
    }
}

export = scoreCard;