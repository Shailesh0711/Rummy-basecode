import config from "../../../../../connections/config";
import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import timeDifference from "../../../../common/timeDiff";
import commonEventEmitter from "../../../../commonEventEmitter";
import { UserInfoIf, splitPlayerDataIf } from "../../../../interfaces/scoreBoardIf";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { getTableData, setTableData } from "../../../cache/Tables";
import formatScoreBoardInfo from "../../../formatResponse/formatScoreBoardInfo";
import formatScoreboardTimerAndSplitInfo from "../../../formatResponse/formatScoreboardTimerAndSplitInfo";
import { removeQueue } from "../../../utils/manageQueue";
import scoreBoardHistory from "../../History/scoreBoardHistory";
import { pointRummyScoreBoadPlayerInfo } from "../helper/pointRummyScoreBoadPlayerInfo";
import Scheduler from "../../../../scheduler";
import formatDealRummyDeclareInScoreboardInfo from "../../../formatResponse/formatDealRummyDeclareInScoreboardInfo";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getUser } from "../../../cache/User";
import { formatMultiPlayerScore } from "../../../utils/formatMultiPlayerScore";
import { multiPlayerWinnScore } from "../../../../clientsideapi/multiPlayerWinnScore";
import { getUserInfoForCreditAmount } from "../../rounds/helper/getUserInfoForCreditAmount";
import { markCompletedGameStatus } from "../../../../clientsideapi/markCompletedGameStatus";

export async function pointRummyScoreBoard(
    tableId: string,
    currentRound: number,
    isNextRound: boolean,
    allDeclared: boolean,
    userID?: string | null,
) {
    const { POINT_RUMMY_SCORE_BOARD_TIMER, REMAIN_PLAYERS_FINISH_TIMER } = config();
    try {
        logger.info("----->> pointRummyScoreBoard :: tableId: ", tableId);
        logger.info("----->> pointRummyScoreBoard :: currentRound: ", currentRound);
        logger.info("----->> pointRummyScoreBoard :: isNextRound: ", isNextRound);
        logger.info("----->> pointRummyScoreBoard :: allDeclared: ", allDeclared);
        logger.info("----->> pointRummyScoreBoard :: userID: ", userID ? userID : "");

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("----->> pointRummyScoreBoard :: roundTableData: ", roundTableData);

        const tableData = await getTableData(tableId);
        logger.info("----->> pointRummyScoreBoard :: tableData: ", tableData);

        await removeQueue(`${tableData.gameType}:${tableData.gameId}:${tableData.lobbyId}`, tableId);

        let timer: number = NUMERICAL.ZERO;
        let schedularTimer: number = NUMERICAL.ZERO;
        let isGameOver = false;
        let message = ``;

        let playersInfo: UserInfoIf[] = await pointRummyScoreBoadPlayerInfo(tableId, roundTableData);
        timer = timeDifference(new Date(), roundTableData.updatedAt, REMAIN_PLAYERS_FINISH_TIMER);
        if (isNextRound || allDeclared) {
            message = `New game start in 0 seconds`
            timer = POINT_RUMMY_SCORE_BOARD_TIMER - NUMERICAL.ONE;
            isGameOver = true;
        } else {
            message = MESSAGES.MESSAGE.OTHER_PLAYER_DECLARING_MESSAGE;
        }

        let formatedRes = await formatScoreBoardInfo(
            tableId,
            timer,
            [roundTableData.trumpCard],
            playersInfo,
            false,
            message,
            isGameOver
        );

        logger.info("---------->> pointRummyScoreBoard :: playersInfo :: ", playersInfo)
        logger.info("---------->> pointRummyScoreBoard :: formatedRes :: ", formatedRes)

        if (isNextRound || allDeclared) {

            roundTableData.tableState = TABLE_STATE.DISPLAY_SCOREBOARD;
            roundTableData.updatedAt = new Date();

            timer = POINT_RUMMY_SCORE_BOARD_TIMER - NUMERICAL.ONE;
            schedularTimer = POINT_RUMMY_SCORE_BOARD_TIMER;

            await setRoundTableData(tableId, currentRound, roundTableData);

            // const finalWinner = await checkFinalWinerInScoreBoard(playersInfo,1);
            // logger.info(`--------->> ScoreBoard :: finalWinner :: `, finalWinner);

            if (!allDeclared && isNextRound) {

                formatedRes.isLeaveBtn = true;
                let playersCount = NUMERICAL.ZERO;
                let winnerIndex: number = NUMERICAL.ZERO;
                let winAmount: number = NUMERICAL.ZERO
                for await (const player of formatedRes.scoreBoradTable) {
                    if (player.Status === PLAYER_STATE.WIN_ROUND) {
                        formatedRes.scoreBoradTable[playersCount].Status = PLAYER_STATE.WIN;
                        winnerIndex = playersCount;
                    } else {
                        winAmount += player.DealScore
                    }
                    playersCount += NUMERICAL.ONE;
                }

                tableData.winner.push(formatedRes.scoreBoradTable[winnerIndex].userId);
                await setTableData(tableData);

                for await (const player of playersInfo) {
                    if (
                        player.Status !== PLAYER_STATE.LOST &&
                        player.Status !== PLAYER_STATE.LEFT &&
                        !player.isSwitchTable
                    ) {
                        if (player.tableId === tableId) {

                            formatedRes.scoreBoradTable[winnerIndex].gameScore = formatedRes.scoreBoradTable[winnerIndex].Status === PLAYER_STATE.WIN ?
                                (winAmount === NUMERICAL.ZERO ? `-` : `+ ₹${winAmount * tableData.bootAmount}`) : formatedRes.scoreBoradTable[winnerIndex].gameScore
                            commonEventEmitter.emit(EVENTS.SCORE_BORAD, {
                                socket: player.socketId,
                                data: formatedRes
                            });
                        }
                    }
                }

                // set scoreboard history for users 
                for await (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                        await scoreBoardHistory(tableId, currentRound, formatedRes, roundTableData.seats[seat].userId);
                    }
                }

            }

            await setRoundTableData(tableId, currentRound, roundTableData);

            message = `New game start in 0 seconds`;

            logger.info("---------->> pointRummyScoreBoard :: playersInfo :: 3", playersInfo)

            let splitPlayerData: splitPlayerDataIf[] = [];

            if (allDeclared) {

                const scoreBoardTimerAndSplitRes = await formatScoreboardTimerAndSplitInfo(
                    timer,
                    message,
                    false,
                    [],
                    true
                );

                commonEventEmitter.emit(EVENTS.SCOREBOARD_TIMER_AND_SPLIT, {
                    tableId: tableId,
                    data: scoreBoardTimerAndSplitRes
                })

            }

            //------------------------------------------------------------------------------------------------------------

            let { bootAmount, lobbyId, gameId } = tableData;
            // for all player data to client side api
            const allPlayerDetails = await getUserInfoForCreditAmount(
                tableId,
                tableData.winner[NUMERICAL.ZERO],
                roundTableData.seats,
                bootAmount
            );
            logger.info(
                "------->> pointRummyScoreBoard :: allPlayerDetails :: ",
                allPlayerDetails
            );


            const randomUserData = await getUser(tableData.winner[NUMERICAL.ZERO]);
            logger.info("------>> ------>> pointRummyScoreBoard : : :: randomUserData :: ", randomUserData);

            // winner get data for client side api
            const apiData = await formatMultiPlayerScore(tableId, tableData.lobbyId, allPlayerDetails);
            logger.info("------>> ------>> pointRummyScoreBoard : : :: apiData :: ", apiData);


            // creadit amount for winner players
            await multiPlayerWinnScore(apiData, randomUserData.authToken);

            // make game complate 
            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    const userData = await getUser(roundTableData.seats[seat].userId)
                    await markCompletedGameStatus({
                        tableId,
                        gameId: gameId,
                        tournamentId: lobbyId
                    },
                        userData.authToken,
                        userData.socketId
                    );
                }
            }

            //--------------------------------------------------------------------------------------------------------------

            await Scheduler.addJob.ScoreBoardTimerQueue({
                timer: schedularTimer * NUMERICAL.THOUSAND,
                tableId,
                currentRound,
                isAutoSplit: false
            });

            logger.info("------>> pointRummyScoreBoard : : :: isGameOver :: ", isGameOver);

            if (isGameOver) {
                await Scheduler.addJob.ScoreBoardLeaveDelayQueueTimer({
                    timer: NUMERICAL.ONE * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound
                })
            }


            // for scoreboard history 
            if (allDeclared) {

                formatedRes.isLeaveBtn = true;
                let playersCount = NUMERICAL.ZERO;
                let winnerIndex: number = NUMERICAL.ZERO;
                let winAmount: number = NUMERICAL.ZERO
                for await (const player of formatedRes.scoreBoradTable) {
                    if (player.Status === PLAYER_STATE.WIN_ROUND) {
                        formatedRes.scoreBoradTable[playersCount].Status = PLAYER_STATE.WIN;
                        winnerIndex = playersCount;
                        // break;
                    } else {
                        winAmount += player.DealScore
                    }
                    playersCount += NUMERICAL.ONE;
                }

                for await (const player of playersInfo) {
                    if (
                        player.Status !== PLAYER_STATE.LOST &&
                        player.Status !== PLAYER_STATE.LEFT &&
                        !player.isSwitchTable
                    ) {
                        if (player.tableId === tableId) {

                            formatedRes.scoreBoradTable[winnerIndex].gameScore = formatedRes.scoreBoradTable[winnerIndex].Status === PLAYER_STATE.WIN ?
                                (winAmount === NUMERICAL.ZERO ? `-` : `+ ₹${winAmount * tableData.bootAmount}`) : formatedRes.scoreBoradTable[winnerIndex].gameScore
                        }
                    }
                }

                for await (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                        await scoreBoardHistory(tableId, currentRound, formatedRes, roundTableData.seats[seat].userId);
                    }
                }

                // set scoreboard history
                await scoreBoardHistory(tableId, currentRound, formatedRes);
            }

        } else {

            // const finalWinnerDeclare = await checkFinalWinerInScoreBoard(playersInfo,1);
            const declaredPlayerData: UserInfoIf[] = [];
            let finalWinnerPlayerData = {} as UserInfoIf;
            let playerCount: number = NUMERICAL.ZERO;
            let winAmount: number = NUMERICAL.ZERO;
            let winnerIndex: number = NUMERICAL.ZERO;

            const allPlayerStatus = formatedRes.scoreBoradTable.map((ele) => ele.Status)
            logger.info("---------->> pointRummyScoreBoard :: allPlayerStatus :: ", allPlayerStatus);

            const isAllPlayerDeclare = allPlayerStatus.includes(PLAYER_STATE.DECLARING);
            logger.info("---------->> pointRummyScoreBoard :: isAllPlayerDeclared :: ", !isAllPlayerDeclare);

            for await (const player of formatedRes.scoreBoradTable) {
                if (player.Status === PLAYER_STATE.WIN_ROUND) {
                    formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    finalWinnerPlayerData = player;
                    winnerIndex = playerCount
                } else {
                    winAmount += player.DealScore
                }
                if (player.userId === userID) {
                    declaredPlayerData.push(player);
                }
                playerCount += NUMERICAL.ONE;
            }

            formatedRes.scoreBoradTable[winnerIndex].gameScore = formatedRes.scoreBoradTable[winnerIndex].Status === PLAYER_STATE.WIN ?
                (winAmount === NUMERICAL.ZERO ? `-` : `+ ₹${winAmount * tableData.bootAmount}`) : formatedRes.scoreBoradTable[winnerIndex].gameScore

            if (!isAllPlayerDeclare) {
                tableData.winner.push(formatedRes.scoreBoradTable[winnerIndex].userId);
                await setTableData(tableData);
            }

            for await (const player of playersInfo) {

                if (
                    player.Status !== PLAYER_STATE.DECLARING &&
                    player.Status !== PLAYER_STATE.LOST &&
                    player.Status !== PLAYER_STATE.LEFT &&
                    !player.isSwitchTable
                ) {
                    // const playerDetailsIndex = playersInfo.findIndex((p) => p.userId === player.userId);

                    // formatedRes.scoreBoradTable[playerDetailsIndex].Status = formatedRes.scoreBoradTable[playerDetailsIndex].message === MESSAGES.MESSAGE.Eliminated ?
                    //     PLAYER_STATE.ELIMINATED : formatedRes.scoreBoradTable[playerDetailsIndex].Status;

                    if (player.tableId === tableId) {
                        if (userID) {
                            logger.info("----->> pointRummyScoreBoard :: User ID availble: " + player.userId);
                            if (player.userId === userID) {

                                logger.info("---------->> pointRummyScoreBoard :: players 2 :: userID ::", player.userId)
                                logger.info("---------->> pointRummyScoreBoard :: players 2 :: ", player)
                                logger.info("---------->> pointRummyScoreBoard :: players 2 :: formatedRes ::", formatedRes);
                                commonEventEmitter.emit(EVENTS.SCORE_BORAD, {
                                    socket: player.socketId,
                                    data: formatedRes
                                });
                            } else {
                                // DeclareInScoreboard Event
                                logger.info("---------->> pointRummyScoreBoard :: already display scoreBoard :: userID", player.userId)
                                // finalWinnerPlayerData.Status = PLAYER_STATE.WIN;
                                // declaredPlayerData[NUMERICAL.ZERO].Status = declaredPlayerData[NUMERICAL.ZERO].message === MESSAGES.MESSAGE.Eliminated ?
                                //     PLAYER_STATE.ELIMINATED : declaredPlayerData[NUMERICAL.ZERO].Status;

                                const formatRes = await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], [finalWinnerPlayerData]);
                                commonEventEmitter.emit(EVENTS.DECLARE_IN_SCORE_BOARD, {
                                    socket: player.socketId,
                                    data: formatRes
                                })
                            }
                        } else {
                            logger.info("---------->> pointRummyScoreBoard :: players 3:: ", player)
                            commonEventEmitter.emit(EVENTS.SCORE_BORAD, {
                                socket: player.socketId,
                                data: formatedRes
                            })
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.log("---pointRummyScoreBoard :: ERROR ---", error)
        logger.error("---pointRummyScoreBoard :: ERROR ---", error);
        throw error;
    }
}