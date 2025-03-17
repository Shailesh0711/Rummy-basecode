import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { getPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import formatdiscardCardInfo from "../../formatResponse/formatDiscardCardInfo";
import countTotalPoints from "../../utils/countTotalPoint";
import checkCardSequence from "./checkCardSequence";
import Scheduler from "../../../scheduler";
import { discardCardRequestIf } from "../../../interfaces/requestIf";
import countUserCards from "../../utils/countUserCards";
import config from "../../../../connections/config";
import { throwErrorIF } from "../../../interfaces/throwError";
import Errors from "../../../errors"
import { nextPlayerTurn } from "../turn/nextPlayerTurn";
import { getLock } from "../../../lock";

async function discardCard(
    data: discardCardRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("==========================>> discardCard <<================================")
    const { TURN_TIMER } = config()
    let discardCardLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`, `locks:${data.userId}`], 2000);
    try {

        const { cards } = data;
        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;


        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info(`----->> discardCard :: roundTableData ::`, roundTableData)

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DISCARD_CARD_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const playerData = await getPlayerGamePlay(userId, tableId);
        logger.info(`----->> discardCard :: playerData ::`, playerData);
        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DISCARD_CARD_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const currentCards = playerData.currentCards;

        const totalUserCards = await countUserCards(playerData.currentCards);
        logger.info("======> discardCard :: totalUserCards <<=========", totalUserCards);
        let isCardVailable = false;
        if (totalUserCards === NUMERICAL.FOURTEEN) {
            if (playerData.isTurn) {
                if (playerData.isCardPickUp && !playerData.isDiscardcard) {
                    if (cards.length === NUMERICAL.ONE) {

                        cards.map((card: string) => {
                            currentCards.find((cardFind, index) => {
                                for (let i = NUMERICAL.ZERO; i < cardFind.length; i++) {
                                    if (cardFind[i] === card) {
                                        currentCards[index].splice(i, NUMERICAL.ONE);
                                        isCardVailable = true;
                                    }
                                }
                            })
                        });

                        logger.info(`==========>> discardCard :: card :: ${isCardVailable} :: isCardVailable :: `, isCardVailable);

                        if (isCardVailable) {

                            playerData.isDiscardcard = true;
                            playerData.lastDiscardcard = cards[NUMERICAL.ZERO];
                            playerData.socketId = socket.id;

                            roundTableData.opendDeck.push(cards[NUMERICAL.ZERO]);
                            roundTableData.isPickUpFromOpenDeck = true;
                            roundTableData.isSecondaryTurn = false;

                            await setRoundTableData(tableId, currentRound, roundTableData);

                            const resCard = await checkCardSequence(currentCards, playerData, tableId);
                            const totalPoints = await countTotalPoints(resCard);
                            const formatedDiscardcards = await formatdiscardCardInfo(userId, tableId, playerData.seatIndex, totalPoints, resCard, cards, roundTableData.opendDeck);

                            logger.info("==========>> discardCard :: checkCardSequence :: <<=======", resCard);
                            logger.info("==========>> discardCard :: totalPoints :: <<=======", totalPoints);
                            logger.info("==========>> discardCard :: formatedDiscardcards :: <<======", formatedDiscardcards);

                            // cancel turn timer
                            await Scheduler.cancelJob.StartTurnCancel(tableId);
                            await Scheduler.cancelJob.secondaryTimerCancel(tableId);

                            commonEventEmitter.emit(EVENTS.DISCARD_CARD, {
                                tableId,
                                data: formatedDiscardcards
                            });

                            if (discardCardLocks) {
                                await getLock().release(discardCardLocks);
                                discardCardLocks = null;
                            }

                            await nextPlayerTurn({
                                timer: TURN_TIMER,
                                tableId: tableId,
                                currentTurnPlayerId: userId,
                                currentRound: currentRound,
                                currentPlayerSeatIndex: playerData.seatIndex,
                            });

                        } else {
                            logger.warn("----->> discardCard :: already card is discarded")
                            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                socket,
                                data: {
                                    isPopup: true,
                                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.CARD_ALREADY_DISCARDED,
                                }
                            })
                        }
                    } else {
                        // only one card discard
                        logger.warn("----->> discardCard :: only one card discard")
                        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                            socket,
                            data: {
                                isPopup: true,
                                popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                message: MESSAGES.POPUP.MIDDLE_TOAST_POP.DISCARD_CARDS_VALIDATION_MESSAGE,
                            }
                        })
                    }
                } else {
                    // pickup condition
                    logger.warn("---discardCard :: pickup card first")
                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            message: MESSAGES.POPUP.MIDDLE_TOAST_POP.PICK_CARD_FIRST_MESSAGE,
                        }
                    })
                }
            } else {
                logger.warn("---discardCard :: wait for your turn !")
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.WAIT_FOR_YOUR_TURN_POPUP_MESSAGE,
                    }
                })
            }
        } else {
            // pickup condition
            logger.warn("---discardCard :: need fourteen cards !")
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.NEED_FOURTEEN_CARDS_VALIDATION_MESSAGE,
                }
            });
        }

    } catch (error: any) {
        logger.error("---discardCard :: ERROR: " + error)

        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- discardCard :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId :: ${data.tableId}`
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
                "--- discardCard :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId :: ${data.tableId}`
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
                "--- discardCard :: UnknownError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId :: ${data.tableId}`
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
        } else if (error && error.type === ERROR_TYPE.DISCARD_CARD_ERROR) {
            logger.error(
                `--- discardCard :: ERROR_TYPE :: ${ERROR_TYPE.DISCARD_CARD_ERROR}::`,
                error,
                "userId :: ",
                data.userId,
                `tableId :: ${data.tableId}`
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
            })
        } else {
            logger.error(
                "--- discardCard :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId :: ${data.tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.DISCARD_CARD_ERROR,
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
        if (discardCardLocks) {
            await getLock().release(discardCardLocks);
        }
    }
}

export = discardCard;