import config from "../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData, setRoundTableData } from "../../gamePlay/cache/Rounds";
import { formatFinishTimerStart } from "../../gamePlay/formatResponse";
import checkCardSequence from "../../gamePlay/play/cards/checkCardSequence";
import countTotalPoints from "../../gamePlay/utils/countTotalPoint";
import countUserCards from "../../gamePlay/utils/countUserCards";
import { finishTimerStartHelperRequestIf } from "../../interfaces/requestIf";
import { throwErrorIF } from "../../interfaces/throwError";
import Scheduler from "../../scheduler"
import { requestValidator } from "../../validator";
import Errors from "../../errors";
import { formatFinishTimerStartIf } from "../../interfaces/responseIf";
import { getLock } from "../../lock";

async function finishTimerStartHandler(
    { data }: finishTimerStartHelperRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("=================>> finishTimerStartHandler <<=====================");
    const { CANCEL_BATTELE_POPUP_MESSAGE, START_FINISH_TIMER } = config()
    const finishTimerStartLocks = await getLock().acquire([`locks:${data.tableId}`], 2000);
    try {
        data = await requestValidator.finishTimerValidator(data);
        logger.info("----->> finishTimerStartHandler :: data :: ", data);

        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;
        const { finishCard } = data;

        const playerData = await getPlayerGamePlay(userId, tableId);
        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.FINISHINF_TIMER_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> finishTimerStartHandler :: roundTableData ::`, roundTableData);

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.FINISHINF_TIMER_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> finishTimerStartHandler :: playerData ::`, playerData);

        const totalUserCards = await countUserCards(playerData.currentCards);
        logger.info("----->> finishTimerStartHandler :: totalUserCards :: ", totalUserCards);
        if (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {

            if (playerData.isTurn) {
                if (finishCard.length === NUMERICAL.ONE) {
                    if (totalUserCards === NUMERICAL.FOURTEEN) {
                        await Scheduler.cancelJob.TurncancelCancel(tableId);
                        await Scheduler.cancelJob.secondaryTimerCancel(tableId);
                        roundTableData.updatedAt = new Date();
                        roundTableData.tableState = TABLE_STATE.FINISH_TIMER_START;
                        roundTableData.finishTimerStartPlayerId = playerData.userId;
                        roundTableData.finishDeck = finishCard;
                        await setRoundTableData(tableId, currentRound, roundTableData);

                        let currentCards: string[][] = JSON.parse(JSON.stringify(playerData.currentCards))
                        logger.info(`----->> finishTimerStartHandler :: currentCards :: JSON CONVERT ::`, currentCards);

                        let cardArrIndex: number = NUMERICAL.ZERO;
                        for await (const cardFind of currentCards) {
                            for (let i = NUMERICAL.ZERO; i < cardFind.length; i++) {
                                if (cardFind[i] === finishCard[NUMERICAL.ZERO]) {
                                    currentCards[cardArrIndex].splice(i, NUMERICAL.ONE);
                                    break;
                                }
                            }
                            cardArrIndex += NUMERICAL.ONE;
                        }

                        playerData.finishCard = finishCard[NUMERICAL.ZERO];
                        playerData.playingStatus = PLAYER_STATE.DECLARED;
                        const resCard = await checkCardSequence(currentCards, playerData, tableId);
                        const totalPoints = await countTotalPoints(resCard);
                        const formattedResponce: formatFinishTimerStartIf = await formatFinishTimerStart(
                            userId,
                            tableId,
                            playerData.seatIndex,
                            START_FINISH_TIMER,
                            totalPoints,
                            finishCard,
                            resCard
                        );

                        logger.info(`----->> finishTimerStartHandler :: checkCardSequence ::`, resCard);
                        logger.info(`----->> finishTimerStartHandler :: totalPoints ::`, totalPoints);
                        logger.info(`----->> finishTimerStartHandler :: formatFinishTimerStart ::`, formattedResponce);

                        commonEventEmitter.emit(EVENTS.FINISH_TIMER_STARTED, {
                            tableId,
                            data: formattedResponce
                        });

                        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                            socket: playerData.socketId,
                            data: {
                                isPopup: true,
                                popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
                                title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                message: MESSAGES.POPUP.MIDDLE_TOAST_POP.FOR_VAILD_SEQUENCE_AND_DECLARE,
                            }
                        });
                        await Scheduler.addJob.StartFinishTimerQueue({
                            tableId,
                            timer: START_FINISH_TIMER * NUMERICAL.THOUSAND,
                            userId,
                            currentRound,
                        });
                    } else {
                        // send response for 14  cards needed to finish
                        logger.warn(`----->> finishTimerStartHandler :: send response for 14  cards needed to finish ::`);

                        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                            socket,
                            data: {
                                isPopup: true,
                                popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                message: MESSAGES.POPUP.MIDDLE_TOAST_POP.FOURTEEN_CARDS_VALIDATION_MESSAGE,
                            }
                        })
                    }
                } else {
                    logger.warn(`----->> finishTimerStartHandler :: one then one card in finish card ::`);
                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            message: MESSAGES.POPUP.MIDDLE_TOAST_POP.MORE_THAN_ONE_FINISH_CARD,
                        }
                    });
                }
            } else {
                // wait for your turn popup
                logger.warn(`----->> finishTimerStartHandler :: wait for your turn ::`);
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.WAIT_FOR_YOUR_TURN_POPUP_MESSAGE,
                    }
                });
            }
        }
    } catch (error: any) {
        console.log("---finishTimerStartHandler :: ERROR: ", error);
        logger.error("---finishTimerStartHandler :: ERROR: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- finishTimerStartHandler :: InvalidInput :: ERROR ::",
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
                    message: MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT]
                }
            })
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- finishTimerStartHandler :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                data.userId
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
                data: {
                    isPopup: true,
                    popupType: CANCEL_BATTELE_POPUP_MESSAGE ?
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
                "--- finishTimerStartHandler :: UnknownError :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.FINISHINF_TIMER_ERROR) {
            logger.error(
                `--- finishTimerStartHandler :: ERROR_TYPE :: ${ERROR_TYPE.FINISHINF_TIMER_ERROR}::`,
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
                "--- finishTimerStartHandler :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.FINISH_TIMER_ERROR,
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
    } finally {
        await getLock().release(finishTimerStartLocks);
        logger.info("-=-=-=-=>> finishTimerStartHandler :: lock relese ::")
    }
}

export = finishTimerStartHandler;