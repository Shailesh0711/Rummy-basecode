import config from "../../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import { dropRoundRequestIf } from "../../../interfaces/requestIf";
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import formatDropRoundInfo from "../../formatResponse/formatDropRoundInfo";
import ScoreBoard from "../scoreBoard/scoreBoad";
import { nextPlayerTurn } from "../turn/nextPlayerTurn";
import Errors from "../../../errors"
import { throwErrorIF } from "../../../interfaces/throwError";
import checkRoundWiner from "../winner/checkRoundWiner";
import { getLock } from "../../../lock";
import checkCardSequence from "../cards/checkCardSequence";
import { getTableData } from "../../cache/Tables";
import { cards } from "../../../interfaces/cards";
import { playingPlayerForTGP } from "../../utils/playingPlayerForTGP";
import { formatDropRoundInfoIf } from "../../../interfaces/responseIf";

async function dropUpdateData(
    userId: string,
    tableId: string,
    cutPoints: number,
    playerData: playerPlayingDataIf,
    rummyType: string,
    isDrop = true
): Promise<void> {
    logger.info("------------>> dropUpdateData <<------------------")

    try {
        logger.info("----->> dropUpdateData :: isDrop :: ", isDrop)
        if (isDrop) {
            let formatedResponcesForDropTable = {} as formatDropRoundInfoIf;
            if (rummyType === RUMMY_TYPES.DEALS_RUMMY || rummyType === RUMMY_TYPES.POINT_RUMMY) {

                const currentCards: string[][] = playerData.currentCards;

                const oneGroupCards: string[][] = [[]]
                for await (const cards of currentCards) {
                    oneGroupCards[NUMERICAL.ZERO].push(...cards)
                }

                playerData.gamePoints -= cutPoints;
                playerData.cardPoints = cutPoints;
                playerData.roundLostPoint = cutPoints;
                playerData.playingStatus = PLAYER_STATE.DROP_TABLE_ROUND;
                playerData.currentCards = oneGroupCards;
                playerData.dropCutPoint = cutPoints;
                playerData.isDrop = true;

                await setPlayerGamePlay(userId, tableId, playerData);

                const resCard = await checkCardSequence(oneGroupCards, playerData, tableId);
                formatedResponcesForDropTable = await formatDropRoundInfo(userId, tableId, playerData.seatIndex, playerData.gamePoints + playerData.roundLostPoint, resCard, true);
                logger.info("----->> dropUpdateData :: oneGroupCards :: ", oneGroupCards)
                logger.info("----->> dropUpdateData :: resCard :: ", resCard)
                logger.info("----->> dropUpdateData :: formatDropRoundInfo :: ", formatedResponcesForDropTable)

            } else if (rummyType === RUMMY_TYPES.POOL_RUMMY) {
                const currentCards: string[][] = playerData.currentCards;

                const oneGroupCards: string[][] = [[]]
                for await (const cards of currentCards) {
                    oneGroupCards[NUMERICAL.ZERO].push(...cards)
                }

                playerData.remainDrop -= NUMERICAL.ONE;
                playerData.gamePoints += cutPoints;
                playerData.cardPoints = cutPoints;
                playerData.playingStatus = PLAYER_STATE.DROP_TABLE_ROUND;
                playerData.currentCards = oneGroupCards;
                playerData.dropCutPoint = cutPoints;
                playerData.roundLostPoint = cutPoints;
                playerData.isDrop = true;

                await setPlayerGamePlay(userId, tableId, playerData);

                const resCard = await checkCardSequence(oneGroupCards, playerData, tableId);
                formatedResponcesForDropTable = await formatDropRoundInfo(userId, tableId, playerData.seatIndex, playerData.gamePoints - playerData.roundLostPoint, resCard, true)
                logger.info("----->> dropUpdateData :: oneGroupCards :: ", oneGroupCards)
                logger.info("----->> dropUpdateData :: resCard :: ", resCard)
                logger.info("----->> dropUpdateData :: formatDropRoundInfo :: ", formatedResponcesForDropTable);
            }

            commonEventEmitter.emit(EVENTS.DROP_ROUND, {
                tableId,
                data: formatedResponcesForDropTable
            });

            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: `${playerData.username} is dropped round`,
                }
            });
        } else {
            let resCard: cards[] = [];
            const formatedResponcesForDropTable = await formatDropRoundInfo(userId, tableId, playerData.seatIndex, playerData.gamePoints, resCard, false)
            commonEventEmitter.emit(EVENTS.DROP_ROUND, {
                tableId,
                data: formatedResponcesForDropTable
            });
        }
    } catch (error) {
        logger.error("---dropUpdateData :: ERROR: ", error);
        throw error;
    }
}


async function dropRound(
    data: dropRoundRequestIf,
    socket: any,
    ack?: Function
) {
    logger.info("-------------->> dropRound <<------------------")
    const dropRoundLocks = await getLock().acquire([`locks:${data.tableId}`], 2000);
    try {

        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        const tableData = await getTableData(tableId)
        logger.info(`----->> dropRound :: tableData ::`, tableData);

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info(`----->> dropRound :: roundTableData ::`, roundTableData)
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DROP_ROUND_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const playerData = await getPlayerGamePlay(userId, tableId);
        logger.info(`----->> dropRound :: playerData ::`, playerData);
        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DROP_ROUND_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const playingPlayerCount = await playingPlayerForTGP(roundTableData);
        logger.info(`----->> dropRound :: playingPlayerCount ::`, playingPlayerCount);
        const poolType = Number(tableData.gamePoolType);
        logger.info(`----->> dropRound :: poolType ::`, poolType);
        const dealType = Number(socket.eventMetaData.dealType) || Number(data.dealType) || Number(tableData.dealType);
        logger.info(`----->> dropRound :: dealType ::`, dealType);

        logger.info(`----->> dropRound :: RUMMY_TYPE ::`, tableData.rummyType);
        let cutPoints: number;
        if (
            playerData.playingStatus !== PLAYER_STATE.LEFT &&
            playerData.playingStatus !== PLAYER_STATE.LOST
        ) {

            // for deal rummy
            if (tableData.rummyType === RUMMY_TYPES.DEALS_RUMMY || tableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
                if (roundTableData && roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {
                    if (playingPlayerCount > NUMERICAL.ONE) {
                        if (roundTableData.tableState === TABLE_STATE.TURN_STARTED) {

                            if (tableData.maximumSeat === NUMERICAL.TWO) {

                                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                    socket,
                                    data: {
                                        isPopup: true,
                                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_NOT_ALLOWED,
                                    }
                                });

                            } else {
                                if (playerData.countTurns > NUMERICAL.ZERO) {
                                    cutPoints = NUMERICAL.FORTY;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }
                                else {
                                    cutPoints = NUMERICAL.TWENTY;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }

                                await getLock().release(dropRoundLocks);
                                await checkRoundWiner(tableId, userId, currentRound);
                            }
                        } else {
                            logger.warn(
                                "----->> dropRound :: round turn not started yet !",
                                "userId ::",
                                data.userId
                            );
                            await getLock().release(dropRoundLocks);
                            await dropUpdateData(userId, tableId, NUMERICAL.ZERO, playerData, tableData.rummyType, false);
                            // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                            //     socket,
                            //     data: {
                            //         isPopup: true,
                            //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                            //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            //         message: roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START ?
                            //             MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_WHEN_FINISHING_STATE : roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START ?
                            //                 MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_WHEN_ROUND_OVER_STATE : MESSAGES.POPUP.MIDDLE_TOAST_POP.TABLE_TURN_STATE_POPUP_MESSAGE,
                            //     }
                            // });
                        }
                    } else {
                        logger.warn(
                            "----->> dropRound :: only one player left in table",
                            "userId ::",
                            data.userId
                        );
                    }
                } else {
                    logger.warn(
                        "----->> dropRound :: table state is display scoreboard",
                        "userId ::",
                        data.userId
                    );
                }

            }
            // for Pool rummy
            else if (tableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {

                if (roundTableData && roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {
                    if (roundTableData.tableState === TABLE_STATE.TURN_STARTED && playingPlayerCount > NUMERICAL.ONE) {
                        if (playerData.remainDrop > NUMERICAL.ZERO) {
                            if (poolType === NUMERICAL.ONE_HUNDRED_ONE) {
                                if (playerData.countTurns > NUMERICAL.ZERO) {
                                    cutPoints = NUMERICAL.FORTY;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }
                                else {
                                    cutPoints = NUMERICAL.TWENTY;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }
                            } else if (poolType === NUMERICAL.TWO_HUNDRED_ONE) {
                                if (playerData.countTurns > NUMERICAL.ZERO) {
                                    cutPoints = NUMERICAL.FIFTY;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }
                                else {
                                    cutPoints = NUMERICAL.TWENTY_FIVE;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }

                            } else if (poolType === NUMERICAL.SIXTY_ONE) {
                                if (playerData.countTurns > NUMERICAL.ZERO) {
                                    cutPoints = NUMERICAL.THIRTY;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }
                                else {
                                    cutPoints = NUMERICAL.FIFTEEN;
                                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND
                                    roundTableData.isDropOrLeave = true;
                                    await setRoundTableData(tableId, currentRound, roundTableData);
                                    await dropUpdateData(userId, tableId, cutPoints, playerData, tableData.rummyType);
                                }
                            } else {
                                // not existing pool type
                                logger.warn(
                                    "----->> dropRound :: not existing pool type !",
                                    "userId ::",
                                    data.userId
                                );
                                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                    socket,
                                    data: {
                                        isPopup: true,
                                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.POOL_TYPE_NOT_EXISING_MESSAGE,
                                    }
                                });
                            }

                            logger.info("==========>> roundTableData :: currentRound  <<===========", roundTableData.currentRound);
                            // start next round
                            await getLock().release(dropRoundLocks);
                            await checkRoundWiner(tableId, userId, currentRound);

                        } else {
                            logger.warn(
                                "----->> dropRound :: remain drop warn !",
                                "userId ::",
                                data.userId
                            );
                            await getLock().release(dropRoundLocks);
                            await dropUpdateData(userId, tableId, NUMERICAL.ZERO, playerData, tableData.rummyType, false);
                            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                socket,
                                data: {
                                    isPopup: true,
                                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.REMAIN_DROP_POPUP_MESSAGE,
                                }
                            });
                        }
                    } else {
                        logger.warn(
                            "----->> dropRound :: round turn not started yet !",
                            "userId ::",
                            data.userId
                        );
                        await getLock().release(dropRoundLocks);
                        await dropUpdateData(userId, tableId, NUMERICAL.ZERO, playerData, tableData.rummyType, false);
                        // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        //     socket,
                        //     data: {
                        //         isPopup: true,
                        //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                        //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        //         message: roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START ?
                        //             MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_WHEN_FINISHING_STATE : roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START ?
                        //                 MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_WHEN_ROUND_OVER_STATE : MESSAGES.POPUP.MIDDLE_TOAST_POP.TABLE_TURN_STATE_POPUP_MESSAGE,
                        //     }
                        // });
                    }
                } else {
                    logger.warn(
                        "----->> dropRound :: table state is display scoreboard",
                        "userId ::",
                        data.userId
                    );
                }
            }


        } else {
            logger.warn(
                "----->> dropRound :: player already left",
                "userId ::",
                data.userId
            );
        }
    } catch (error: any) {
        console.log("---dropRound :: ERROR", error);
        logger.error("---dropRound :: ERROR", error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- dropRound :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                data.userId
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE ?
                        MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE : MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            })
        } else if (error instanceof Errors.UnknownError) {
            nonProdMsg = 'GRPC_FAILED';
            logger.error(
                "--- dropRound :: UnknownError :: ERROR ::",
                error,
                "userId :: ",
                data.userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
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
            })
        } else if (error && error.type === ERROR_TYPE.DROP_ROUND_ERROR) {
            logger.error(
                `--- dropRound :: ERROR_TYPE :: ${ERROR_TYPE.DROP_ROUND_ERROR}::`,
                error,
                "userId :: ",
                data.userId
            );
            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
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
                "--- dropRound :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.DROP_ROUND_ERROR,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        }

    }
}

export = dropRound;

