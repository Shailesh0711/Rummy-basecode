import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, SPLIT_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { throwErrorIF } from "../../../../interfaces/throwError";
import { getPlayerGamePlay, removePlayerGameData, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData, removeRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { turnHistory } from "../../History";
import { ScoreBoard } from "../../scoreBoard";
import Errors from "../../../../errors";
import Scheduler from "../../../../scheduler";
import cancelAllTimers from "../helper/cancelTimers";
import { nextPlayerTurn } from "../../turn/nextPlayerTurn";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { getTableData, removeTableData } from "../../../cache/Tables";
import { removeScoreBoardHistory } from "../../../cache/ScoreBoardHistory";
import { removeRoundTableHistory } from "../../../cache/RoundHistory";
import { removeTurnHistoy } from "../../../cache/TurnHistory";
import config from "../../../../../connections/config";
import { getLock } from "../../../../lock";
import { removeQueue } from "../../../utils/manageQueue";
import { addPointInRoundWinnerPlayer } from "../../playerDeclared/helper/addPointInRoundWinnerPlayer";
import countUserCards from "../../../utils/countUserCards";
import { cardNotDiscardCard } from "../../turn/helper/nextTurnHelper";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import autoDeclareRemainPlayers from "../../playerDeclared/autoDeclareRemainPlayers";

async function checkRoundWiner(
    tableId: string,
    userId: string,
    currentRound: number,
): Promise<void> {
    logger.info("---------------------->> checkRoundWiner <<-----------------------------");
    const { TURN_TIMER } = config();
    let checkRoundWinerLocks = await getLock().acquire([`locks:${tableId}`], 2000);
    try {
        logger.info(`----->> checkRoundWiner :: tableId :: ${tableId} :: userId :: ${userId} :: currentRound: ${currentRound}`);

        const [roundTableData, playerData] = await Promise.all([
            getRoundTableData(tableId, currentRound),
            getPlayerGamePlay(userId, tableId),
        ]);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.CHECK_WINNER_PLAYER_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> checkRoundWiner :: roundTableData ::`, roundTableData)

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.CHECK_WINNER_PLAYER_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> checkRoundWiner :: playerData ::`, playerData);
        logger.info(`----->> checkRoundWiner :: currentPlayer ::`, roundTableData.currentPlayer);
        logger.info(`----->> checkRoundWiner :: totalPlayers ::`, roundTableData.totalPlayers);
        logger.info(`----->> checkRoundWiner :: PlayRoundTableState :: ${roundTableData.seats[`s${playerData.seatIndex}`].userStatus} :: PlayerGamePlaySate :: ${playerData.userStatus}`,);

        logger.info(`----->> checkRoundWiner :: RUMMY_TYPE ::`, roundTableData.rummyType);
        let uIds: string[] = [];
        // all player left than

        const tableData = await getTableData(tableId);
        logger.info(`----->> checkRoundWiner :: tableData ::`, tableData);
        const { gameId, lobbyId, gameType } = tableData;
        // all player left than

        let watchingPlayerCount: number = NUMERICAL.ZERO
        for (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                if (roundTableData.seats[seat].userStatus === PLAYER_STATE.WATCHING) {
                    watchingPlayerCount += NUMERICAL.ONE;
                }
            }
        }

        if (roundTableData.totalPlayers === NUMERICAL.ZERO) {
            if (
                (
                    tableData.rummyType === RUMMY_TYPES.POINT_RUMMY &&
                    watchingPlayerCount === NUMERICAL.ZERO
                ) ||
                tableData.rummyType !== RUMMY_TYPES.POINT_RUMMY
            ) {
                // cancel all timer
                await cancelAllTimers(tableId, roundTableData.seats, true);

                await removeQueue(`${gameType}:${gameId}:${lobbyId}`, tableId);

                const userIDs: string[] = []
                for (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                        userIDs.push(roundTableData.seats[seat].userId)
                    }
                }

                for await (const userId of userIDs) {
                    await removeRejoinTableHistory(userId, gameId, lobbyId);
                    await removePlayerGameData(userId, tableId);
                }

                for (let i = NUMERICAL.ONE; i <= currentRound; i++) {
                    await removeRoundTableData(tableId, i);
                }

                await removeTableData(tableId);
                await removeTurnHistoy(tableId);
                await removeRoundTableHistory(tableId);
                await removeScoreBoardHistory(tableId)

            }

        }
        else if (roundTableData.currentPlayer < NUMERICAL.TWO) {
            logger.info(`----->> checkRoundWiner :: currentPlayer less than two ::`, roundTableData.currentPlayer);

            const seats = roundTableData.seats;
            uIds = [];

            for await (const key of Object.keys(seats)) {
                if (Object.keys(seats[key]).length > NUMERICAL.ZERO) {
                    if (seats[key].userStatus === PLAYER_STATE.PLAYING) {
                        uIds.push(seats[key].userId)
                    }
                }
            }

            logger.info(`----->> checkRoundWiner :: playing Player UserIDs ::`, uIds);
            if (
                (playerData.isTurn && playerData.userStatus === PLAYER_STATE.LEFT && playerData.playingStatus === PLAYER_STATE.LEFT && playerData.isLeft) ||
                playerData.isTurn && playerData.playingStatus === PLAYER_STATE.DROP_TABLE_ROUND

            ) {
                await turnHistory(tableId, roundTableData.turnCount, playerData, currentRound);
            }

            if (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {

                if (roundTableData.tableState === TABLE_STATE.ROUND_OVER && playerData.isDeclaringState) {
                    if (playerData.playingStatus === PLAYER_STATE.LEFT) {

                        if (checkRoundWinerLocks) {
                            await getLock().release(checkRoundWinerLocks);
                            checkRoundWinerLocks = null;
                        }

                        const playerDataInfo: playerPlayingDataIf = JSON.parse(JSON.stringify(playerData))
                        playerDataInfo.playingStatus = PLAYER_STATE.DECLARED;
                        await setPlayerGamePlay(playerDataInfo.userId, tableId, playerDataInfo);
                        await autoDeclareRemainPlayers(playerDataInfo.userId, tableId, currentRound);
                        playerDataInfo.playingStatus = PLAYER_STATE.LEFT;
                        await setPlayerGamePlay(userId, tableId, playerDataInfo);
                        await setPlayerGamePlay(playerDataInfo.userId, tableId, playerDataInfo);
                    }
                } else if (roundTableData.tableState !== TABLE_STATE.ROUND_OVER) {

                    // cancel all timers
                    logger.info(`----->> checkRoundWiner :: userID :: 1 ::`, uIds[NUMERICAL.ZERO]);
                    await cancelAllTimers(tableId, seats);
                    // winner player data
                    let winnerPlayerData: playerPlayingDataIf = await getPlayerGamePlay(uIds[NUMERICAL.ZERO], tableId);
                    logger.info(`----->> checkRoundWiner :: userID :: 2 ::`, uIds[NUMERICAL.ZERO]);
                    logger.info("----->> checkRoundWiner :: winnerPlayer <<=======", winnerPlayerData);

                    const totalUserCards = await countUserCards(winnerPlayerData.currentCards);

                    if (totalUserCards === NUMERICAL.FOURTEEN) {
                        let { currentPlayerData } = await cardNotDiscardCard(winnerPlayerData, roundTableData, currentRound);
                        winnerPlayerData = currentPlayerData;
                    }

                    winnerPlayerData.cardPoints = NUMERICAL.ZERO
                    winnerPlayerData.playingStatus = PLAYER_STATE.WIN_ROUND;
                    roundTableData.validDeclaredPlayer = uIds[NUMERICAL.ZERO];
                    roundTableData.seats[`s${winnerPlayerData.seatIndex}`].userStatus = PLAYER_STATE.WIN_ROUND;

                    // deal rummy save data for winner
                    if (
                        roundTableData.rummyType === RUMMY_TYPES.DEALS_RUMMY ||
                        roundTableData.rummyType === RUMMY_TYPES.POINT_RUMMY
                    ) {
                        await addPointInRoundWinnerPlayer(roundTableData, winnerPlayerData, tableId);
                    }

                    // pool rummy save data for winner
                    if (roundTableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {
                        await setPlayerGamePlay(winnerPlayerData.userId, tableId, winnerPlayerData)
                    }
                    
                    logger.info("----->> checkRoundWiner :: winnerPlayerData :: after change", winnerPlayerData);

                    await setRoundTableData(tableId, currentRound, roundTableData);

                    await removeQueue(`${gameType}:${gameId}:${lobbyId}`, tableId);

                    if (checkRoundWinerLocks) {
                        await getLock().release(checkRoundWinerLocks);
                        checkRoundWinerLocks = null;
                    }

                    await ScoreBoard(tableId, currentRound, true, false);
                }
            }

            if (roundTableData.rummyType === RUMMY_TYPES.DEALS_RUMMY) {
                if (
                    roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD &&
                    roundTableData.totalPlayers < NUMERICAL.TWO &&
                    roundTableData.dealType !== currentRound
                ) {
                    logger.info(`----->> checkRoundWiner :: roundTableData.tableState  :: ${roundTableData.tableState}`);
                    uIds = [];
                    for await (const key of Object.keys(seats)) {
                        if (Object.keys(roundTableData.seats[key]).length > NUMERICAL.ONE) {
                            if (
                                seats[key].userStatus !== PLAYER_STATE.LEFT &&
                                seats[key].userStatus !== PLAYER_STATE.LOST
                            ) {
                                uIds.push(seats[key].userId)
                            }
                        }
                    }

                    // cancel all timers
                    await cancelAllTimers(tableId, seats);
                    // winner player data
                    logger.info(`----->> checkRoundWiner :: userID :: All ::`, uIds);
                    let winnerPlayerData = await getPlayerGamePlay(uIds[NUMERICAL.ZERO], tableId);
                    logger.info(`----->> checkRoundWiner :: userID ::`, uIds[NUMERICAL.ZERO]);
                    logger.info("----->> checkRoundWiner :: winnerPlayer <<=======", winnerPlayerData);

                    winnerPlayerData.cardPoints = NUMERICAL.ZERO
                    winnerPlayerData.playingStatus = PLAYER_STATE.WIN_ROUND;
                    winnerPlayerData.gamePoints += NUMERICAL.EIGHTEEN;
                    roundTableData.validDeclaredPlayer = uIds[NUMERICAL.ZERO];
                    roundTableData.seats[`s${winnerPlayerData.seatIndex}`].userStatus = PLAYER_STATE.WIN_ROUND;

                    logger.info("----->> checkRoundWiner :: winnerPlayerData :: after change", winnerPlayerData);
                    await Promise.all([
                        setRoundTableData(tableId, currentRound, roundTableData),
                        setPlayerGamePlay(winnerPlayerData.userId, tableId, winnerPlayerData),
                    ]);

                    if (checkRoundWinerLocks) {
                        await getLock().release(checkRoundWinerLocks);
                        checkRoundWinerLocks = null;
                    }

                    await ScoreBoard(tableId, currentRound, false, false);

                }
            } else if (roundTableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {
                if (
                    roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD &&
                    roundTableData.totalPlayers < NUMERICAL.TWO
                ) {
                    logger.info(`----->> checkRoundWiner :: roundTableData.tableState  :: ${roundTableData.tableState}`);
                    uIds = [];
                    for await (const key of Object.keys(seats)) {
                        if (Object.keys(roundTableData.seats[key]).length > NUMERICAL.ONE) {
                            if (
                                seats[key].userStatus !== PLAYER_STATE.LEFT &&
                                seats[key].userStatus !== PLAYER_STATE.LOST
                            ) {
                                uIds.push(seats[key].userId)
                            }
                        }
                    }

                    if (roundTableData.isSplit) {
                        if (playerData.playingStatus === PLAYER_STATE.SPLIT_AMOUNT) {
                            playerData.splitDetails.splitStatus = SPLIT_STATE.NO;
                            await setPlayerGamePlay(userId, tableId, playerData)
                        }
                    }

                    // cancel all timers
                    await cancelAllTimers(tableId, seats);
                    // winner player data
                    logger.info(`----->> checkRoundWiner :: userID :: All ::`, uIds);
                    let winnerPlayerData = await getPlayerGamePlay(uIds[NUMERICAL.ZERO], tableId);
                    logger.info(`----->> checkRoundWiner :: userID ::`, uIds[NUMERICAL.ZERO]);
                    logger.info("----->> checkRoundWiner :: winnerPlayer <<=======", winnerPlayerData);

                    winnerPlayerData.cardPoints = NUMERICAL.ZERO
                    winnerPlayerData.playingStatus = PLAYER_STATE.WIN_ROUND;
                    roundTableData.validDeclaredPlayer = uIds[NUMERICAL.ZERO];
                    roundTableData.seats[`s${winnerPlayerData.seatIndex}`].userStatus = PLAYER_STATE.WIN_ROUND;

                    logger.info("----->> checkRoundWiner :: winnerPlayerData :: after change", winnerPlayerData);
                    await Promise.all([
                        setRoundTableData(tableId, currentRound, roundTableData),
                        setPlayerGamePlay(winnerPlayerData.userId, tableId, winnerPlayerData),
                    ]);

                    if (checkRoundWinerLocks) {
                        await getLock().release(checkRoundWinerLocks);
                        checkRoundWinerLocks = null;
                    }

                    await ScoreBoard(tableId, currentRound, false, false);

                }
            }
        } else {
            // if left player turn active and player left than cancel turn 
            if (
                (playerData.isTurn && playerData.userStatus === PLAYER_STATE.LEFT && playerData.playingStatus === PLAYER_STATE.LEFT && playerData.isLeft) ||
                (playerData.isTurn && playerData.playingStatus === PLAYER_STATE.DROP_TABLE_ROUND) ||
                roundTableData.totalPlayers < NUMERICAL.TWO ||
                roundTableData.currentPlayer < NUMERICAL.TWO ||
                playerData.isTurn
            ) {
                await Scheduler.cancelJob.TurncancelCancel(tableId);
                await Scheduler.cancelJob.secondaryTimerCancel(tableId);
                await turnHistory(tableId, roundTableData.turnCount, playerData, currentRound);
            }

            roundTableData.isDropOrLeave = true;
            await setRoundTableData(tableId, currentRound, roundTableData);

            if (
                roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START &&
                playerData.playingStatus === PLAYER_STATE.DECLARED
            ) {
                logger.info(`----->> checkRoundWiner :: StartFinishTimerCancel ::`);
                await Scheduler.cancelJob.StartFinishTimerCancel(tableId);
                if (checkRoundWinerLocks) {
                    await getLock().release(checkRoundWinerLocks);
                    checkRoundWinerLocks = null;
                }
                await nextPlayerTurn({
                    timer: TURN_TIMER,
                    tableId,
                    currentTurnPlayerId: userId,
                    currentRound,
                    currentPlayerSeatIndex: playerData.seatIndex
                });
            }
            else if (roundTableData.tableState === TABLE_STATE.ROUND_OVER && playerData.isDeclaringState) {
                if (playerData.playingStatus === PLAYER_STATE.LEFT) {

                    if (checkRoundWinerLocks) {
                        await getLock().release(checkRoundWinerLocks);
                        checkRoundWinerLocks = null;
                    }

                    const playerDataInfo: playerPlayingDataIf = JSON.parse(JSON.stringify(playerData));
                    playerDataInfo.playingStatus = PLAYER_STATE.DECLARED;
                    await setPlayerGamePlay(playerDataInfo.userId, tableId, playerDataInfo);
                    await autoDeclareRemainPlayers(playerDataInfo.userId, tableId, currentRound);
                    playerDataInfo.playingStatus = PLAYER_STATE.LEFT;
                    await setPlayerGamePlay(userId, tableId, playerDataInfo);
                    await setPlayerGamePlay(playerDataInfo.userId, tableId, playerDataInfo);
                }
            }
            else if (
                roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD
            ) {
                if (roundTableData.isSplit) {
                    if (playerData.playingStatus === PLAYER_STATE.SPLIT_AMOUNT) {
                        playerData.splitDetails.splitStatus = SPLIT_STATE.NO;
                        await setPlayerGamePlay(userId, tableId, playerData)
                    }
                }
            }
            else {
                if (
                    playerData.isTurn
                ) {
                    logger.info(`----->> checkRoundWiner :: player turn ::`);
                    await Scheduler.cancelJob.TurncancelCancel(tableId);
                    await Scheduler.cancelJob.secondaryTimerCancel(tableId);

                    if (checkRoundWinerLocks) {
                        await getLock().release(checkRoundWinerLocks);
                        checkRoundWinerLocks = null;
                    }
                    await nextPlayerTurn({
                        timer: TURN_TIMER,
                        tableId,
                        currentTurnPlayerId: userId,
                        currentRound,
                        currentPlayerSeatIndex: playerData.seatIndex
                    });
                }
            }
        }
    } catch (error: any) {
        console.log("---checkRoundWiner :: ERROR: " + error);
        logger.error("---checkRoundWiner :: ERROR: " + error);
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- checkRoundWiner :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                userId
            );
            throw new Errors.InvalidInput(error)
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- checkRoundWiner :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            throw new Errors.CancelBattle(error)
        } else if (error instanceof Errors.UnknownError) {
            nonProdMsg = 'GRPC_FAILED';
            logger.error(
                "--- checkRoundWiner :: UnknownError :: ERROR ::",
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            throw new Errors.UnknownError(error)

        } else if (error && error.type === ERROR_TYPE.DROP_ROUND_ERROR) {
            logger.error(
                `--- checkRoundWiner :: ERROR_TYPE :: ${ERROR_TYPE.DROP_ROUND_ERROR}::`,
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        } else {
            logger.error(
                "--- checkRoundWiner :: commonError :: ERROR ::",
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            throw error;
        }
    }
    finally {
        if (checkRoundWinerLocks) {
            await getLock().release(checkRoundWinerLocks);
        }
    }
}

export = checkRoundWiner;