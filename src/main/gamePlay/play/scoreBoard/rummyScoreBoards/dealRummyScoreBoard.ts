import config from "../../../../../connections/config";
import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import timeDifference from "../../../../common/timeDiff";
import commonEventEmitter from "../../../../commonEventEmitter";
import { UserInfoIf, splitPlayerDataIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { getTableData } from "../../../cache/Tables";
import formatScoreBoardInfo from "../../../formatResponse/formatScoreBoardInfo";
import Scheduler from "../../../../scheduler"
import { dealRummyCheckFinalWinerInScoreBoard } from "../helper/dealRummyCheckFinalWinerInScoreBoard";
import scoreBoardHistory from "../../History/scoreBoardHistory";
import formatScoreboardTimerAndSplitInfo from "../../../formatResponse/formatScoreboardTimerAndSplitInfo";
import formatDealRummyDeclareInScoreboardInfo from "../../../formatResponse/formatDealRummyDeclareInScoreboardInfo";
import dealRummyScoreBoadPlayerInfo from "../helper/dealRummyScoreBoadPlayerInfo";

export async function dealRummyScoreBoard(
    tableId: string,
    currentRound: number,
    isNextRound: boolean,
    allDeclared: boolean,
    userID?: string | null,
) {
    const { NEW_GAME_START_TIMER, SCORE_BOARD_TIMER, REMAIN_PLAYERS_FINISH_TIMER, DEAL_NEW_GAME_TIMER, SPLIT_AMOUNT_TIMER } = config();
    try {
        logger.info("----->> dealRummyScoreBoard :: tableId: ", tableId);
        logger.info("----->> dealRummyScoreBoard :: currentRound: ", currentRound);
        logger.info("----->> dealRummyScoreBoard :: isNextRound: ", isNextRound);
        logger.info("----->> dealRummyScoreBoard :: allDeclared: ", allDeclared);
        logger.info("----->> dealRummyScoreBoard :: userID: ", userID ? userID : "");

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("----->> dealRummyScoreBoard :: roundTableData: ", roundTableData);

        const tableData = await getTableData(tableId);

        let timer: number = NUMERICAL.ZERO;
        let schedularTimer: number = NUMERICAL.ZERO;
        let message = ``;
        let isGameOver = false;

        let playersInfo: UserInfoIf[] = await dealRummyScoreBoadPlayerInfo(tableId, roundTableData);
        timer = timeDifference(new Date(), roundTableData.updatedAt, REMAIN_PLAYERS_FINISH_TIMER);
        schedularTimer = timer;
        let isLeaveBtn = false;

        if (isNextRound || allDeclared) {
            message = `Next round start in 0 seconds`
            timer = SCORE_BOARD_TIMER - NUMERICAL.ONE;
            schedularTimer = timer;

            if (
                tableData.dealType === currentRound || roundTableData.totalPlayers < NUMERICAL.TWO
            ) {
                message = `new game start in 0 seconds`
                schedularTimer = DEAL_NEW_GAME_TIMER;
                timer = schedularTimer;
                isLeaveBtn = true
                isGameOver = true;
            }

        } else {
            message = MESSAGES.MESSAGE.OTHER_PLAYER_DECLARING_MESSAGE;
        }

        const formatedRes = await formatScoreBoardInfo(
            tableId,
            timer,
            [roundTableData.trumpCard],
            playersInfo,
            false,
            message,
            isLeaveBtn
        );

        logger.info("---------->> dealRummyScoreBoard :: playersInfo :: ", playersInfo);
        logger.info("---------->> dealRummyScoreBoard :: formatedRes :: ", formatedRes);

        if (roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD && roundTableData.totalPlayers === NUMERICAL.ONE) {
            logger.info(`---------->> dealRummyScoreBoard :: roundTableData.tableState :: ${roundTableData.tableState} ::  roundTableData.totalPlayers :: ${roundTableData.totalPlayers}`);
            let finalWinnerPlayerData = {} as UserInfoIf;
            let playerCount: number = NUMERICAL.ZERO;
            schedularTimer = DEAL_NEW_GAME_TIMER;
            isGameOver = true

            for await (const player of formatedRes.scoreBoradTable) {
                if (player.Status === PLAYER_STATE.WIN_ROUND) {
                    formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    formatedRes.message = `new game start in 0 seconds`
                    formatedRes.timer = DEAL_NEW_GAME_TIMER
                    finalWinnerPlayerData = player;
                    break;
                }
                playerCount += NUMERICAL.ONE;
            }
            formatedRes.isLeaveBtn = true;
            logger.info(`---------->> dealRummyScoreBoard :: formatedRes :: ${roundTableData.tableState} :: `, formatedRes);
            logger.info(`---------->> dealRummyScoreBoard :: finalWinnerPlayerData :: `, finalWinnerPlayerData);

            const playerData = await getPlayerGamePlay(finalWinnerPlayerData.userId, tableId);

            playerData.isWinner = true;

            await setPlayerGamePlay(finalWinnerPlayerData.userId, tableId, playerData);

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

            if (isGameOver) {
                await Scheduler.addJob.ScoreBoardLeaveDelayQueueTimer({
                    timer: NUMERICAL.ONE * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound
                });
            }

        } else if (isNextRound || allDeclared) {

            roundTableData.tableState = TABLE_STATE.DISPLAY_SCOREBOARD;
            roundTableData.updatedAt = new Date();

            await setRoundTableData(tableId, currentRound, roundTableData);

            if (!allDeclared && isNextRound) {

                const finalWinner = await dealRummyCheckFinalWinerInScoreBoard(playersInfo, currentRound);
                logger.info("---------->> dealRummyScoreBoard :: finalWinner :: ", finalWinner);
                let playerCount: number = NUMERICAL.ZERO;

                playersInfo = JSON.parse(JSON.stringify(playersInfo))
                logger.info("---------->> dealRummyScoreBoard :: playersInfo :: JSON :: 1 ", playersInfo);


                for await (const player of formatedRes.scoreBoradTable) {
                    if (finalWinner.isMultiWinner) {
                        for await (const drawnPlayer of finalWinner.mulltiWinnerPlayerData) {
                            if (drawnPlayer.userId === player.userId) {

                                const playerData = await getPlayerGamePlay(drawnPlayer.userId, tableId)
                                playerData.isWinner = true;
                                await setPlayerGamePlay(drawnPlayer.userId, tableId, playerData);

                                formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.DRAW;
                                // formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                            }
                        }
                    }

                    if (finalWinner.isFinalWinner && player.userId === finalWinner.winnerPlayerData.userId) {

                        const playerData = await getPlayerGamePlay(finalWinner.winnerPlayerData.userId, tableId)
                        playerData.isWinner = true;
                        await setPlayerGamePlay(finalWinner.winnerPlayerData.userId, tableId, playerData);

                        formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;

                    }

                    if (finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND && player.userId !== finalWinner.winnerPlayerData.userId) {

                        formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.LOST;

                    } else if (player.Status === PLAYER_STATE.WIN_ROUND && roundTableData.totalPlayers === NUMERICAL.ONE) {

                        const playerData = await getPlayerGamePlay(player.userId, tableId)
                        playerData.isWinner = true;
                        await setPlayerGamePlay(player.userId, tableId, playerData);

                        formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    }

                    playerCount += NUMERICAL.ONE;
                }

                logger.info("---------->> dealRummyScoreBoard :: playersInfo :: JSON :: 2", playersInfo);
                for await (const player of playersInfo) {
                    if (
                        player.Status !== PLAYER_STATE.LOST &&
                        player.Status !== PLAYER_STATE.LEFT
                    ) {
                        if (player.tableId === tableId) {

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

            await setRoundTableData(tableId, currentRound, roundTableData);

            logger.info("---------->> dealRummyScoreBoard :: playersInfo :: ", playersInfo)

            let splitPlayerData: splitPlayerDataIf[] = [];

            if (allDeclared) {

                const finalWinner = await dealRummyCheckFinalWinerInScoreBoard(playersInfo, currentRound);
                let playerCount: number = NUMERICAL.ZERO;

                logger.info("---------->> dealRummyScoreBoard :: finalWinner :: ", finalWinner);

                for await (const player of formatedRes.scoreBoradTable) {
                    if (finalWinner.isMultiWinner) {
                        for await (const drawnPlayer of finalWinner.mulltiWinnerPlayerData) {
                            if (drawnPlayer.userId === player.userId) {
                                formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.DRAW;
                                // formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                            }
                        }
                    }

                    if (finalWinner.isFinalWinner && player.userId === finalWinner.winnerPlayerData.userId) {
                        formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    }

                    if (finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND && player.userId !== finalWinner.winnerPlayerData.userId) {
                        formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.LOST;
                    } else if (player.Status === PLAYER_STATE.WIN_ROUND && roundTableData.totalPlayers === NUMERICAL.ONE) {
                        formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    }

                    playerCount += NUMERICAL.ONE;
                }

                // set scoreboard history
                await scoreBoardHistory(tableId, currentRound, formatedRes);

                const scoreBoardTimerAndSplitRes = await formatScoreboardTimerAndSplitInfo(
                    timer,
                    message,
                    false,
                    splitPlayerData,
                    isLeaveBtn
                )

                commonEventEmitter.emit(EVENTS.SCOREBOARD_TIMER_AND_SPLIT, {
                    tableId,
                    data: scoreBoardTimerAndSplitRes
                })
            }

            await Scheduler.addJob.ScoreBoardTimerQueue({
                timer: schedularTimer * NUMERICAL.THOUSAND,
                tableId,
                currentRound,
                isAutoSplit: false
            });

            if (isGameOver) {
                await Scheduler.addJob.ScoreBoardLeaveDelayQueueTimer({
                    timer: NUMERICAL.ONE * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound
                });
            }

        } else {

            const finalWinnerDeclare = await dealRummyCheckFinalWinerInScoreBoard(playersInfo, currentRound);
            logger.info("---------->> dealRummyScoreBoard :: finalWinnerDeclare :: ", finalWinnerDeclare);

            playersInfo = JSON.parse(JSON.stringify(playersInfo))
            logger.info("---------->> dealRummyScoreBoard :: playersInfo :: JSON :: ", playersInfo);

            let declaredPlayerData: UserInfoIf[] = [];
            let declaredPlayerDataClone: UserInfoIf[] = [];
            const roundWinner: UserInfoIf[] = []

            let playerCount: number = NUMERICAL.ZERO;
            let roundWinnerIScoreboardIndex: number = NUMERICAL.MINUS_ONE;
            let dealWinnerIndex: number = NUMERICAL.MINUS_ONE;
            let dealWinnerCount: number = NUMERICAL.ZERO;

            const allPlayerStatus = formatedRes.scoreBoradTable.map((ele) => ele.Status)
            logger.info("---------->> dealRummyScoreBoard :: allPlayerStatus :: ", allPlayerStatus);

            const isAllPlayerDeclare = allPlayerStatus.includes(PLAYER_STATE.DECLARING);
            logger.info("---------->> dealRummyScoreBoard :: isAllPlayerDeclared :: ", !isAllPlayerDeclare);

            let mulltiWinnerPlayerIndex: number = NUMERICAL.ZERO;

            for await (const mulltiWinnerPlayer of finalWinnerDeclare.mulltiWinnerPlayerData) {
                finalWinnerDeclare.mulltiWinnerPlayerData[mulltiWinnerPlayerIndex].Status = PLAYER_STATE.DRAW;
                mulltiWinnerPlayerIndex += NUMERICAL.ONE;
            }

            for await (const player of formatedRes.scoreBoradTable) {
                if (!isAllPlayerDeclare) {

                    if (finalWinnerDeclare.isMultiWinner) {
                        for await (const drawnPlayer of finalWinnerDeclare.mulltiWinnerPlayerData) {
                            if (drawnPlayer.userId === player.userId) {
                                const playerData = await getPlayerGamePlay(drawnPlayer.userId, tableId)
                                playerData.isWinner = true;
                                await setPlayerGamePlay(drawnPlayer.userId, tableId, playerData);

                                formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.DRAW;
                            }


                        }
                    }

                    if (finalWinnerDeclare.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND && player.userId !== finalWinnerDeclare.winnerPlayerData.userId) {
                        roundWinnerIScoreboardIndex = playerCount;
                    }

                    if (finalWinnerDeclare.isFinalWinner && player.userId === finalWinnerDeclare.winnerPlayerData.userId) {

                        const playerData = await getPlayerGamePlay(finalWinnerDeclare.winnerPlayerData.userId, tableId)
                        playerData.isWinner = true;
                        await setPlayerGamePlay(finalWinnerDeclare.winnerPlayerData.userId, tableId, playerData);

                        formatedRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                    }

                }

                if (player.Status === PLAYER_STATE.WIN_ROUND) {
                    roundWinner.push(player)
                }

                if (player.userId === userID) {
                    declaredPlayerData.push(player);
                }
                playerCount += NUMERICAL.ONE;
            }
            declaredPlayerDataClone = JSON.parse(JSON.stringify(declaredPlayerData));

            if (!isAllPlayerDeclare) {

                for await (const player of playersInfo) {
                    if (player.Status === PLAYER_STATE.WIN_ROUND) {
                        dealWinnerIndex = dealWinnerCount
                        break;
                    }
                    dealWinnerCount += NUMERICAL.ONE;
                }
            }

            for await (const player of playersInfo) {
                logger.info("----->> dealRummyScoreBoard :: player.status ", player.Status);
                if (
                    player.Status !== PLAYER_STATE.DECLARING &&
                    player.Status !== PLAYER_STATE.LOST &&
                    player.Status !== PLAYER_STATE.LEFT
                ) {
                    declaredPlayerData = JSON.parse(JSON.stringify(declaredPlayerDataClone));
                    if (roundWinnerIScoreboardIndex !== NUMERICAL.MINUS_ONE) {
                        formatedRes.scoreBoradTable[roundWinnerIScoreboardIndex].Status = PLAYER_STATE.LOST;
                    }
                    if (player.tableId === tableId) {
                        if (userID) {
                            logger.info("----->> dealRummyScoreBoard :: User ID availble: " + player.userId);
                            if (player.userId === userID) {
                                logger.info("---------->> dealRummyScoreBoard :: players 2 :: userID ::", player.userId)
                                logger.info("---------->> dealRummyScoreBoard :: players 2 :: ", player)
                                commonEventEmitter.emit(EVENTS.SCORE_BORAD, {
                                    socket: player.socketId,
                                    data: formatedRes
                                });
                            } else {
                                // DeclareInScoreboard Event
                                logger.info("----->> dealRummyScoreBoard :: already display scoreBoard ");
                                logger.info("----->> dealRummyScoreBoard :: declaredPlayerData :: ", declaredPlayerData[0]);
                                logger.info("----->> dealRummyScoreBoard :: dealWinnerIndex :: ", dealWinnerIndex);

                                let samePlayerIndex: number = NUMERICAL.MINUS_ONE;
                                let otherWinner = false;
                                let flage: boolean = false;

                                if (!isAllPlayerDeclare) {
                                    if (finalWinnerDeclare.isMultiWinner) {
                                        let drawnPlayerCount: number = NUMERICAL.ZERO;
                                        for await (const drawnPlayer of finalWinnerDeclare.mulltiWinnerPlayerData) {
                                            if (drawnPlayer.userId === declaredPlayerData[0].userId) {
                                                samePlayerIndex = drawnPlayerCount;
                                                break;
                                            }
                                            drawnPlayerCount += NUMERICAL.ONE;
                                        }
                                    }
                                    logger.info("----->> dealRummyScoreBoard :: samePlayerIndex :: >> ", samePlayerIndex);

                                    if (samePlayerIndex !== NUMERICAL.MINUS_ONE) {
                                        finalWinnerDeclare.mulltiWinnerPlayerData.splice(samePlayerIndex, NUMERICAL.ONE);
                                        declaredPlayerData[0].Status = PLAYER_STATE.DRAW;
                                    }

                                    if (finalWinnerDeclare.isFinalWinner) {

                                        // dealWiner and finnal winner same
                                        if (playersInfo[dealWinnerIndex].userId === finalWinnerDeclare.winnerPlayerData.userId) {

                                            logger.info("----->> dealRummyScoreBoard :: dealWiner and finnal winner same",)
                                            // if declare Player is win player
                                            if (declaredPlayerData[0].userId === finalWinnerDeclare.winnerPlayerData.userId) {
                                                otherWinner = false;
                                                declaredPlayerData[0].Status = PLAYER_STATE.WIN;
                                                finalWinnerDeclare.winnerPlayerData.Status = PLAYER_STATE.WIN;

                                            } else {
                                                // if declare Player is not win player
                                                otherWinner = true;
                                                finalWinnerDeclare.winnerPlayerData.Status = PLAYER_STATE.WIN;
                                                declaredPlayerData[NUMERICAL.ZERO].Status = PLAYER_STATE.LOST;
                                            }

                                        }
                                        // dealWiner and finnal winner not same
                                        else if (playersInfo[dealWinnerIndex].userId !== finalWinnerDeclare.winnerPlayerData.userId) {

                                            logger.info("----->> dealRummyScoreBoard :: dealWiner and finnal winner not same",)

                                            // finnal winner declare 
                                            if (finalWinnerDeclare.winnerPlayerData.userId === declaredPlayerData[0].userId) {
                                                otherWinner = true;
                                                flage = false;
                                                declaredPlayerData[NUMERICAL.ZERO] = JSON.parse(JSON.stringify(playersInfo[dealWinnerIndex]));
                                                declaredPlayerData[NUMERICAL.ZERO].Status = PLAYER_STATE.LOST;

                                                finalWinnerDeclare.winnerPlayerData.Status = PLAYER_STATE.WIN;
                                            }
                                            // other player declare
                                            else {
                                                otherWinner = true;
                                                flage = true;
                                                finalWinnerDeclare.winnerPlayerData.Status = PLAYER_STATE.WIN;
                                                declaredPlayerData[NUMERICAL.ZERO].Status = PLAYER_STATE.LOST;
                                                declaredPlayerData[NUMERICAL.ONE] = JSON.parse(JSON.stringify(playersInfo[dealWinnerIndex]));
                                                declaredPlayerData[NUMERICAL.ONE].Status = PLAYER_STATE.LOST;
                                            }
                                        }

                                    }

                                    finalWinnerDeclare.winnerPlayerData.Status = PLAYER_STATE.WIN;
                                }
                                logger.info("----->> dealRummyScoreBoard :: samePlayerIndex ", samePlayerIndex);
                                logger.info("----->> dealRummyScoreBoard :: flage ", flage);
                                logger.info("----->> dealRummyScoreBoard :: declaredPlayerData ", declaredPlayerData);
                                logger.info("----->> dealRummyScoreBoard :: finalWinnerDeclare ", finalWinnerDeclare);
                                logger.info("----->> dealRummyScoreBoard :: finalWinnerDeclare.mulltiWinnerPlayerData ", finalWinnerDeclare.mulltiWinnerPlayerData);
                                logger.info("----->> dealRummyScoreBoard :: otherWinner ", otherWinner);
                                logger.info(`----->> dealRummyScoreBoard :: otherWinner :: ${otherWinner} :: isMultiWinner :: ${finalWinnerDeclare.isMultiWinner} :: !isAllPlayerDeclare :: ${!isAllPlayerDeclare} :: `);
                                logger.info(`----->> dealRummyScoreBoard :: winnerPlayerData.userId === declaredPlayerDatauserId :: ${finalWinnerDeclare.winnerPlayerData.userId === declaredPlayerData[0].userId} :: finalWinnerDeclare.isFinalWinner :: ${finalWinnerDeclare.isFinalWinner}`);
                                logger.info("----->> dealRummyScoreBoard :: declaredPlayerData[0] ", declaredPlayerData[0]);

                                const formatRes = !finalWinnerDeclare.isDealOver ?
                                    await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], roundWinner) : finalWinnerDeclare.isMultiWinner && !isAllPlayerDeclare && otherWinner ?
                                        await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], [...finalWinnerDeclare.mulltiWinnerPlayerData, { ...playersInfo[dealWinnerIndex], Status: PLAYER_STATE.LOST }]) : finalWinnerDeclare.isMultiWinner && !isAllPlayerDeclare ?
                                            await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], finalWinnerDeclare.mulltiWinnerPlayerData) : finalWinnerDeclare.isFinalWinner && !isAllPlayerDeclare && otherWinner && flage ?
                                                await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], [{ ...finalWinnerDeclare.winnerPlayerData, Status: PLAYER_STATE.WIN }, declaredPlayerData[NUMERICAL.ONE]]) : finalWinnerDeclare.isFinalWinner && !isAllPlayerDeclare && otherWinner ?
                                                    await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], [{ ...finalWinnerDeclare.winnerPlayerData, Status: PLAYER_STATE.WIN }]) : finalWinnerDeclare.isFinalWinner && finalWinnerDeclare.winnerPlayerData.userId === declaredPlayerData[0].userId && !isAllPlayerDeclare ?
                                                        await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0]) : finalWinnerDeclare.isFinalWinner && !isAllPlayerDeclare ?
                                                            await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], [finalWinnerDeclare.winnerPlayerData]) : await formatDealRummyDeclareInScoreboardInfo(declaredPlayerData[0], roundWinner);

                                logger.info("---------->> dealRummyScoreBoard :: already display scoreBoard :: userID", player.userId);

                                commonEventEmitter.emit(EVENTS.DECLARE_IN_SCORE_BOARD, {
                                    socket: player.socketId,
                                    data: formatRes
                                });
                            }
                        } else {
                            logger.info("---------->> dealRummyScoreBoard :: players 3:: ", player);

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
        logger.error("---- dealRummyScoreBoard :: Error: ", error)
        throw error;
    }
}