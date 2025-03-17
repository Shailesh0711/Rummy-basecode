import config from "../../../../../connections/config";
import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import timeDifference from "../../../../common/timeDiff";
import commonEventEmitter from "../../../../commonEventEmitter";
import { UserInfoIf, splitPlayerDataIf } from "../../../../interfaces/scoreBoardIf";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { getTableData } from "../../../cache/Tables";
import formatScoreBoardInfo from "../../../formatResponse/formatScoreBoardInfo";
import formatScoreboardTimerAndSplitInfo from "../../../formatResponse/formatScoreboardTimerAndSplitInfo";
import scoreBoardHistory from "../../History/scoreBoardHistory";
import { poolRummyCheckFinalWinerInScoreBoard } from "../helper/poolRummyCheckFinalWinerInScoreBoard";
import Scheduler from "../../../../scheduler"
import eligibleForAutoSplitAmount from "../../splitAmount/eligibleForSplitAmount/eligibleForAutoSplitAmount";
import eligibleForSplitAmount from "../../splitAmount/eligibleForSplitAmount";
import formatPoolRummyDeclareInScoreboardInfo from "../../../formatResponse/formatPoolRummyDeclareInScoreboardInfo";
import poolRummyScoreBoadPlayerInfo from "../helper/poolRummyScoreBoadPlayerInfo";
import { rejoinGameForEliminatedPlayer, rejoinPopupSend } from "../helper/rejoinGameForEliminatedPlayer";

export async function poolRummyScoreBoard(
    tableId: string,
    currentRound: number,
    isNextRound: boolean,
    allDeclared: boolean,
    userID?: string | null,
) {
    const { DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER, SCORE_BOARD_TIMER, REMAIN_PLAYERS_FINISH_TIMER, SPLIT_AMOUNT_TIMER, REJOINT_GAME_POPUP_TIMER } = config();
    try {
        logger.info("----->> poolRummyScoreBoard :: tableId: ", tableId);
        logger.info("----->> poolRummyScoreBoard :: currentRound: ", currentRound);
        logger.info("----->> poolRummyScoreBoard :: isNextRound: ", isNextRound);
        logger.info("----->> poolRummyScoreBoard :: allDeclared: ", allDeclared);
        logger.info("----->> poolRummyScoreBoard :: userID: ", userID ? userID : "");

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("----->> poolRummyScoreBoard :: roundTableData: ", roundTableData);

        const tableData = await getTableData(tableId);
        logger.info("----->> poolRummyScoreBoard :: tableData: ", tableData);

        let timer: number = NUMERICAL.ZERO;
        let schedularTimer: number = NUMERICAL.ZERO;
        let isManualSplitAmount = false
        let isAutoSplitAmount = false;
        let isWaitingForRejoinPlayer = false;
        let isSaveScoreBoardHistory = true;
        let message = ``;

        let playersInfo: UserInfoIf[] = await poolRummyScoreBoadPlayerInfo(tableId, roundTableData);
        timer = timeDifference(new Date(), roundTableData.updatedAt, REMAIN_PLAYERS_FINISH_TIMER);
        if (isNextRound || allDeclared) {
            message = `Next round start in 0 seconds`
            timer = SCORE_BOARD_TIMER - NUMERICAL.ONE;
        } else {
            message = MESSAGES.MESSAGE.OTHER_PLAYER_DECLARING_MESSAGE;
        }

        let formatedRes = await formatScoreBoardInfo(
            tableId,
            timer,
            [roundTableData.trumpCard],
            playersInfo,
            isManualSplitAmount,
            message,
            false
        );

        logger.info("---------->> poolRummyScoreBoard :: playersInfo :: ", playersInfo)
        logger.info("---------->> poolRummyScoreBoard :: formatedRes :: ", formatedRes)

        if (
            roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD &&
            roundTableData.totalPlayers === NUMERICAL.ONE
        ) {
            logger.info(`---------->> poolRummyScoreBoard :: roundTableData.tableState :: ${roundTableData.tableState} ::  roundTableData.totalPlayers :: ${roundTableData.totalPlayers}`)
            const winnerData = await poolRummyCheckFinalWinerInScoreBoard(playersInfo);
            schedularTimer = Number(SCORE_BOARD_TIMER) - NUMERICAL.ONE;

            let finalWinnerPlayerData = {} as UserInfoIf;
            let playerCount: number = NUMERICAL.ZERO;

            for await (const player of formatedRes.scoreBoradTable) {
                if (winnerData.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND) {
                    formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    formatedRes.message = `${MESSAGES.MESSAGE.SCORE_BOARD_WINNER_MESSAGE}${winnerData.winAmount}!`
                    formatedRes.timer = NUMERICAL.MINUS_ONE
                    finalWinnerPlayerData = player;
                    break;
                }
                playerCount += NUMERICAL.ONE;
            }
            logger.info(`---------->> poolRummyScoreBoard :: formatedRes :: ${roundTableData.tableState} :: `, formatedRes);
            logger.info(`---------->> poolRummyScoreBoard :: finalWinnerPlayerData :: `, finalWinnerPlayerData);

            commonEventEmitter.emit(EVENTS.SCORE_BORAD, {
                socket: finalWinnerPlayerData.socketId,
                data: formatedRes
            });

            await Scheduler.addJob.ScoreBoardTimerQueue({
                timer: schedularTimer * NUMERICAL.THOUSAND,
                tableId,
                currentRound,
                isAutoSplit: false
            });

        } else if (isNextRound || allDeclared) {

            roundTableData.tableState = TABLE_STATE.DISPLAY_SCOREBOARD;
            roundTableData.updatedAt = new Date();

            timer = SCORE_BOARD_TIMER - NUMERICAL.ONE;
            schedularTimer = SCORE_BOARD_TIMER;
            const autoSplit = tableData.isAutoSplitEnabled ? await eligibleForAutoSplitAmount(playersInfo, tableId, currentRound) : false;
            // const autoSplit = false;
            logger.info(`--------->> poolRummyScoreBoard :: autoSplit :: `, autoSplit)
            logger.info(`--------->> poolRummyScoreBoard :: SPLIT_AMOUNT_TIMERSPLIT_AMOUNT_TIMER :: `, SPLIT_AMOUNT_TIMER)
            if (autoSplit) {
                roundTableData.isEligibleForSplit = true;
                timer = SPLIT_AMOUNT_TIMER - NUMERICAL.ONE;
                schedularTimer = SPLIT_AMOUNT_TIMER;
                isManualSplitAmount = false;
                isAutoSplitAmount = true;
            } else {
                const isSplit = await eligibleForSplitAmount(tableId, currentRound, playersInfo);
                logger.info(`--------->> poolRummyScoreBoard :: manualSplit :: `, isSplit)
                if (isSplit) {
                    roundTableData.isEligibleForSplit = true;
                    isManualSplitAmount = true;
                    timer = SPLIT_AMOUNT_TIMER - NUMERICAL.ONE;
                    schedularTimer = SPLIT_AMOUNT_TIMER;
                }
            }

            await setRoundTableData(tableId, currentRound, roundTableData);

            const finalWinner = await poolRummyCheckFinalWinerInScoreBoard(playersInfo);
            logger.info(`--------->> poolRummyScoreBoard :: finalWinner :: `, finalWinner);

            if (!roundTableData.isWaitingForRejoinPlayer && !finalWinner.isFinalWinner) {

                isWaitingForRejoinPlayer = await rejoinGameForEliminatedPlayer(
                    playersInfo,
                    autoSplit,
                    finalWinner.isFinalWinner
                );

                logger.info(`--------->> ScoreBoard :: isWaitingForRejoinPlayer :: `, isWaitingForRejoinPlayer);
            }

            if (roundTableData.isWaitingForRejoinPlayer) {
                isSaveScoreBoardHistory = false;
            }

            if (!allDeclared && isNextRound) {

                let playersCount = NUMERICAL.ZERO;
                for await (const player of formatedRes.scoreBoradTable) {
                    if (finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND) {

                        formatedRes.scoreBoradTable[playersCount].Status = PLAYER_STATE.WIN;
                        logger.info(`--------->> formatedRes :: formatedRes :: STATE CHANGE TO WIN :: `, formatedRes);
                        break;
                    }
                    playersCount += NUMERICAL.ONE;
                }

                for await (const player of formatedRes.scoreBoradTable) {
                    if (
                        player.Status !== PLAYER_STATE.LOST &&
                        player.Status !== PLAYER_STATE.LEFT
                    ) {
                        if (player.tableId === tableId) {

                            formatedRes.message = player.message === MESSAGES.MESSAGE.Eliminated ? `${MESSAGES.MESSAGE.DEAL} ${currentRound} ${MESSAGES.MESSAGE.SCORE_BOARD_ELIMINATED_PLAYER_MESSAGE}` : message
                            formatedRes.message = finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN ? `${MESSAGES.MESSAGE.SCORE_BOARD_WINNER_MESSAGE}${finalWinner.winAmount}!` : formatedRes.message;

                            formatedRes.message = !finalWinner.isFinalWinner && isWaitingForRejoinPlayer ? MESSAGES.MESSAGE.WAITING_FOR_PLAYER_REJOIN_MESSAGE : formatedRes.message;
                            formatedRes.message = player.message === MESSAGES.MESSAGE.Eliminated && !finalWinner.isFinalWinner && isWaitingForRejoinPlayer ? MESSAGES.MESSAGE.REJOIN_GAME_PLAYER_SCORE_BOARD_MESSAGE : formatedRes.message

                            formatedRes.timer = !finalWinner.isFinalWinner && isWaitingForRejoinPlayer ? NUMERICAL.MINUS_ONE : timer;
                            formatedRes.timer = finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN ? NUMERICAL.MINUS_ONE : formatedRes.timer;

                            formatedRes.timer = !finalWinner.isFinalWinner && isWaitingForRejoinPlayer ? REJOINT_GAME_POPUP_TIMER : formatedRes.timer
                            formatedRes.timer = player.message === MESSAGES.MESSAGE.Eliminated ? NUMERICAL.MINUS_ONE : formatedRes.timer;

                            let playerScoreBoardIndex: number = NUMERICAL.ZERO;
                            for await (const playerInfo of formatedRes.scoreBoradTable) {
                                if (playerInfo.message === MESSAGES.MESSAGE.Eliminated) {
                                    formatedRes.scoreBoradTable[playerScoreBoardIndex].Status = formatedRes.scoreBoradTable[playerScoreBoardIndex].message === MESSAGES.MESSAGE.Eliminated ?
                                        PLAYER_STATE.ELIMINATED : formatedRes.scoreBoradTable[playerScoreBoardIndex].Status;
                                }
                                playerScoreBoardIndex += NUMERICAL.ONE;

                            }

                            commonEventEmitter.emit(EVENTS.SCORE_BORAD, {
                                socket: player.socketId,
                                data: formatedRes
                            });

                        }
                    }
                }

                // set scoreboard history
                await scoreBoardHistory(tableId, currentRound, formatedRes);
            }

            if (isWaitingForRejoinPlayer && !finalWinner.isFinalWinner) {

                const scoreBoardTimerAndSplitRes = await formatScoreboardTimerAndSplitInfo(
                    NUMERICAL.MINUS_ONE,
                    MESSAGES.MESSAGE.WAITING_FOR_PLAYER_REJOIN_MESSAGE,
                    false,
                    [],
                    false
                );

                if (!isNextRound) {
                    for await (const player of playersInfo) {

                        scoreBoardTimerAndSplitRes.message = !finalWinner.isFinalWinner && isWaitingForRejoinPlayer ?
                            MESSAGES.MESSAGE.WAITING_FOR_PLAYER_REJOIN_MESSAGE : scoreBoardTimerAndSplitRes.message;

                        scoreBoardTimerAndSplitRes.message = player.message === MESSAGES.MESSAGE.Eliminated ?
                            MESSAGES.MESSAGE.REJOIN_GAME_PLAYER_SCORE_BOARD_MESSAGE : scoreBoardTimerAndSplitRes.message;

                        scoreBoardTimerAndSplitRes.timer = !finalWinner.isFinalWinner && isWaitingForRejoinPlayer ? REJOINT_GAME_POPUP_TIMER : NUMERICAL.MINUS_ONE;
                        scoreBoardTimerAndSplitRes.timer = player.message === MESSAGES.MESSAGE.Eliminated ? NUMERICAL.MINUS_ONE : scoreBoardTimerAndSplitRes.timer;

                        logger.info(`--------->> ScoreBoard :: Data :: player :  2 ::`, player);
                        logger.info(`--------->> ScoreBoard :: Data :: socketID :  2 ::`, player.socketId);
                        logger.info(`--------->> ScoreBoard :: Data :: UserId :  2 ::`, player.userId);
                        logger.info(`--------->> ScoreBoard :: Data :: UserName :  2 ::`, player.userName);

                        commonEventEmitter.emit(EVENTS.SCOREBOARD_TIMER_AND_SPLIT, {
                            socket: player.socketId,
                            data: scoreBoardTimerAndSplitRes
                        });
                    }
                }

                await rejoinPopupSend(
                    tableId,
                    playersInfo,
                    roundTableData,
                    currentRound
                )

            }

            if (!isAutoSplitAmount && !isWaitingForRejoinPlayer) {

                roundTableData.isWaitingForRejoinPlayer = false;

                await setRoundTableData(tableId, currentRound, roundTableData);

                message = `Next round start in 0 seconds`;

                logger.info("---------->> poolRummyScoreBoard :: playersInfo :: 3", playersInfo)

                let splitPlayerData: splitPlayerDataIf[] = [];

                if (isManualSplitAmount || allDeclared) {
                    for await (const playerInfo of playersInfo) {
                        if (playerInfo.tableId === tableId) {
                            if (
                                playerInfo.message !== MESSAGES.MESSAGE.Eliminated &&
                                playerInfo.Status !== PLAYER_STATE.LOST
                            ) {
                                splitPlayerData.push({
                                    userId: playerInfo.userId,
                                    seatIndex: playerInfo.seatIndex
                                });
                            }
                        }
                    }
                    roundTableData.isEligibleForSplit ? splitPlayerData : (splitPlayerData = []);
                    const scoreBoardTimerAndSplitRes = await formatScoreboardTimerAndSplitInfo(
                        timer,
                        message,
                        isManualSplitAmount,
                        splitPlayerData,
                        false
                    )

                    for await (const player of playersInfo) {
                        logger.info(`---------->> poolRummyScoreBoard :: user Id :: ${player.userId}`);
                        logger.info(`---------->> poolRummyScoreBoard :: socketId :: ${player.socketId}`);

                        scoreBoardTimerAndSplitRes.message = player.message === MESSAGES.MESSAGE.Eliminated ? `${MESSAGES.MESSAGE.DEAL} ${currentRound} ${MESSAGES.MESSAGE.SCORE_BOARD_ELIMINATED_PLAYER_MESSAGE}` : message;
                        scoreBoardTimerAndSplitRes.message = finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND ? `${MESSAGES.MESSAGE.SCORE_BOARD_WINNER_MESSAGE}${finalWinner.winAmount}!` : scoreBoardTimerAndSplitRes.message;
                        scoreBoardTimerAndSplitRes.timer = player.message === MESSAGES.MESSAGE.Eliminated ? NUMERICAL.MINUS_ONE : timer;
                        scoreBoardTimerAndSplitRes.timer = finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND ? NUMERICAL.MINUS_ONE : scoreBoardTimerAndSplitRes.timer;

                        commonEventEmitter.emit(EVENTS.SCOREBOARD_TIMER_AND_SPLIT, {
                            socket: player.socketId,
                            data: scoreBoardTimerAndSplitRes
                        })
                    }
                }

                await Scheduler.addJob.ScoreBoardTimerQueue({
                    timer: schedularTimer * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound,
                    isAutoSplit: false
                });
            } else if (!isWaitingForRejoinPlayer) {
                // for auto split mode logic
                roundTableData.tableState = TABLE_STATE.DISPLAY_SCOREBOARD;
                roundTableData.updatedAt = new Date();
                roundTableData.isAutoSplit = true;
                roundTableData.isWaitingForRejoinPlayer = false;

                await setRoundTableData(tableId, currentRound, roundTableData);
                timer = NUMERICAL.MINUS_ONE; // await for auto split mode 

                const scoreBoardTimerAndSplitRes = await formatScoreboardTimerAndSplitInfo(
                    timer,
                    message,
                    isManualSplitAmount,
                    [],
                    false
                )

                for await (const player of playersInfo) {
                    if (
                        player.Status !== PLAYER_STATE.LOST &&
                        player.Status !== PLAYER_STATE.LEFT
                    ) {
                        if (player.tableId === tableId) {

                            if (player.message === MESSAGES.MESSAGE.Eliminated) {
                                scoreBoardTimerAndSplitRes.message = `${MESSAGES.MESSAGE.DEAL} ${currentRound} ${MESSAGES.MESSAGE.SCORE_BOARD_ELIMINATED_PLAYER_MESSAGE}`
                            } else {
                                scoreBoardTimerAndSplitRes.message = MESSAGES.MESSAGE.SCORE_BOARD_AUTO_SPLIT_MESSAGE
                            }

                            commonEventEmitter.emit(EVENTS.SCOREBOARD_TIMER_AND_SPLIT, {
                                tableId,
                                data: scoreBoardTimerAndSplitRes
                            })
                        }
                    }
                }

                await Scheduler.addJob.ScoreBoardTimerQueue({
                    timer: DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound,
                    isAutoSplit: true
                });

                // splitAmount(tableId, currentRound, false, true)
            }

            // for scoreboard history 
            if (allDeclared && isSaveScoreBoardHistory) {

                let playersCount = NUMERICAL.ZERO;
                for await (const player of formatedRes.scoreBoradTable) {
                    if (finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND) {
                        formatedRes.scoreBoradTable[playersCount].Status = PLAYER_STATE.WIN;
                        break;
                    }
                    playersCount += NUMERICAL.ONE;
                }
                for await (const player of formatedRes.scoreBoradTable) {
                    if (
                        player.Status !== PLAYER_STATE.LOST &&
                        player.Status !== PLAYER_STATE.LEFT
                    ) {
                        if (player.tableId === tableId) {

                            formatedRes.message = player.message === MESSAGES.MESSAGE.Eliminated ? `${MESSAGES.MESSAGE.DEAL} ${currentRound} ${MESSAGES.MESSAGE.SCORE_BOARD_ELIMINATED_PLAYER_MESSAGE}` : message
                            formatedRes.message = finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN ? `${MESSAGES.MESSAGE.SCORE_BOARD_WINNER_MESSAGE}${finalWinner.winAmount}!` : formatedRes.message;
                            formatedRes.timer = player.message === MESSAGES.MESSAGE.Eliminated ? NUMERICAL.MINUS_ONE : timer;
                            formatedRes.timer = finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN ? NUMERICAL.MINUS_ONE : formatedRes.timer;

                            let playerScoreBoardIndex: number = NUMERICAL.ZERO;
                            for await (const playerInfo of formatedRes.scoreBoradTable) {
                                if (playerInfo.message === MESSAGES.MESSAGE.Eliminated) {
                                    formatedRes.scoreBoradTable[playerScoreBoardIndex].Status = formatedRes.scoreBoradTable[playerScoreBoardIndex].message === MESSAGES.MESSAGE.Eliminated ?
                                        PLAYER_STATE.ELIMINATED : formatedRes.scoreBoradTable[playerScoreBoardIndex].Status;
                                }
                                playerScoreBoardIndex += NUMERICAL.ONE;

                            }

                        }
                    }
                }
                // set scoreboard history
                await scoreBoardHistory(tableId, currentRound, formatedRes);
            }

        } else {

            const finalWinnerDeclare = await poolRummyCheckFinalWinerInScoreBoard(playersInfo);
            const declaredPlayerData: UserInfoIf[] = [];
            let finalWinnerPlayerData = {} as UserInfoIf;
            let playerCount: number = NUMERICAL.ZERO;

            for await (const player of formatedRes.scoreBoradTable) {
                if (finalWinnerDeclare.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND) {
                    formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    finalWinnerPlayerData = player;
                }

                formatedRes.scoreBoradTable[playerCount].Status = formatedRes.scoreBoradTable[playerCount].message === MESSAGES.MESSAGE.Eliminated ?
                    PLAYER_STATE.ELIMINATED : formatedRes.scoreBoradTable[playerCount].Status;
                if (player.userId === userID) {

                    declaredPlayerData.push(player);
                }

                playerCount += NUMERICAL.ONE;
            }

            for await (const player of playersInfo) {

                if (
                    player.Status !== PLAYER_STATE.DECLARING &&
                    player.Status !== PLAYER_STATE.LOST &&
                    player.Status !== PLAYER_STATE.LEFT
                ) {

                    if (player.tableId === tableId) {
                        if (userID) {
                            logger.info("----->> poolRummyScoreBoard :: User ID availble: " + player.userId);
                            if (player.userId === userID) {

                                logger.info("---------->> poolRummyScoreBoard :: players 2 :: userID ::", player.userId)
                                logger.info("---------->> poolRummyScoreBoard :: players 2 :: ", player)
                                logger.info("---------->> poolRummyScoreBoard :: players 2 :: formatedRes ::", formatedRes);
                                commonEventEmitter.emit(EVENTS.SCORE_BORAD, {
                                    socket: player.socketId,
                                    data: formatedRes
                                });
                            } else {
                                // DeclareInScoreboard Event
                                logger.info("---------->> poolRummyScoreBoard :: already display scoreBoard :: userID", player.userId)
                                finalWinnerPlayerData.Status = PLAYER_STATE.WIN;
                                declaredPlayerData[NUMERICAL.ZERO].Status = declaredPlayerData[NUMERICAL.ZERO].message === MESSAGES.MESSAGE.Eliminated ?
                                    PLAYER_STATE.ELIMINATED : declaredPlayerData[NUMERICAL.ZERO].Status;

                                const formatRes = finalWinnerDeclare.isFinalWinner ? await formatPoolRummyDeclareInScoreboardInfo(declaredPlayerData[0], finalWinnerPlayerData) : await formatPoolRummyDeclareInScoreboardInfo(declaredPlayerData[0]);
                                commonEventEmitter.emit(EVENTS.DECLARE_IN_SCORE_BOARD, {
                                    socket: player.socketId,
                                    data: formatRes
                                })
                            }
                        } else {
                            logger.info("---------->> poolRummyScoreBoard :: players 3:: ", player)
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
        logger.error(`---- poolRummyScoreBoard :: ERROR :: `, error);
        throw error;
    }
}