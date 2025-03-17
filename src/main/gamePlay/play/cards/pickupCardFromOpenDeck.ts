import config from "../../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { pickUpCardFromOpenDecRequestIf } from "../../../interfaces/requestIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { formatPickupOpenDeck } from "../../formatResponse";
import countTotalPoints from "../../utils/countTotalPoint";
import countUserCards from "../../utils/countUserCards";
import checkCardSequence from "./checkCardSequence";
import Errors from "../../../errors";
import { getLock } from "../../../lock";

async function pickupCardFromOpenDeck(
    data: pickUpCardFromOpenDecRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("================>> pickupCardFromOpenDeck <<=========================")
    const { THIRTEEN_CARDS_VALIDATION_MESSAGE } = config()
    const pickupCardFromOpenDeckLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`, `locks:${data.userId}`], 2000);
    try {
        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        const roundTableData = await getRoundTableData(tableId, currentRound);
        const playerData = await getPlayerGamePlay(userId, tableId);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> pickupCardFromOpenDeck :: roundTableData ::`, roundTableData)

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> pickupCardFromOpenDeck :: playerData ::`, playerData);

        let openCardsDeck = roundTableData.opendDeck
        const lastIndexOfCurrentCards = playerData.currentCards.length - 1;
        const currentCard = playerData.currentCards

        logger.info("----->> pickupCardFromOpenDeck :: open cards :: before :: ", openCardsDeck.length);
        logger.info("----->> pickupCardFromOpenDeck :: lastIndexOfCurrentCards :: ", lastIndexOfCurrentCards);

        const totalUserCards = await countUserCards(playerData.currentCards);
        logger.info("----->> pickupCardFromOpenDeck :: totalUserCards :: ", totalUserCards);

        if (totalUserCards === NUMERICAL.THIRTEEN) {
            if (openCardsDeck.length > 0) {
                if (roundTableData.tableState === TABLE_STATE.TURN_STARTED) {
                    if (playerData.userStatus === PLAYER_STATE.PLAYING && playerData.isTurn && playerData.playingStatus === PLAYER_STATE.CARD_DISTRIBUTION) {
                        if (!playerData.isCardPickUp) {
                            const roundTableDataInfo = await getRoundTableData(tableId, currentRound);
                            const playerDataInfo = await getPlayerGamePlay(userId, tableId);
                            const ran = openCardsDeck.length - NUMERICAL.ONE;
                            const card = openCardsDeck[ran];

                            if (
                                (card.split("_")[NUMERICAL.TWO] === "J" && !roundTableData.isPickUpFromOpenDeck) ||
                                card.split("_")[NUMERICAL.TWO] !== "J"
                            ) {
                                openCardsDeck.splice(ran, NUMERICAL.ONE);
                                roundTableDataInfo.opendDeck = openCardsDeck;
                                roundTableDataInfo.isPickUpFromOpenDeck = true;
                                currentCard[lastIndexOfCurrentCards].push(card);

                                await setRoundTableData(tableId, currentRound, roundTableDataInfo);

                                logger.info("----->> pickupCardFromOpenDeck :: card From Open Deck :: ", card);
                                logger.info("----->> pickupCardFromOpenDeck :: current cards :: ", currentCard);

                                playerDataInfo.lastPickCard = card;
                                playerDataInfo.lastCardPickUpScource = PLAYER_STATE.OPEN_DECK;
                                playerDataInfo.isCardPickUp = true;
                                playerDataInfo.socketId = socket.id;
                                playerDataInfo.countTurns += NUMERICAL.ONE;
                                playerDataInfo.remainMissingTurn = NUMERICAL.THREE;

                                const resCard = await checkCardSequence(currentCard, playerDataInfo, tableId);
                                const totalPoints = await countTotalPoints(resCard);
                                const FormatedResponce = await formatPickupOpenDeck(userId, tableId, playerData.seatIndex, totalPoints, resCard, openCardsDeck, card);

                                logger.info("----->> pickupCardFromOpenDeck :: checkCardSequence :: ", checkCardSequence);
                                logger.info("----->> pickupCardFromOpenDeck :: totalPoints :: ", totalPoints);
                                logger.info("----->> pickupCardFromOpenDeck :: formatPickupOpenDeck :: ", formatPickupOpenDeck);

                                commonEventEmitter.emit(EVENTS.PICK_CARD_FROM_OPEN_DECK, {
                                    tableId,
                                    data: FormatedResponce
                                });

                            }

                            if (card.split("_")[NUMERICAL.TWO] === "J" && roundTableData.isPickUpFromOpenDeck) {
                                // message send 
                                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                    socket,
                                    data: {
                                        isPopup: false,
                                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.JOKER_NOT_PICKUP_MESSAGE,
                                    }
                                })
                            }

                        } else {
                            logger.warn(`----->> pickupCardFromOpenDeck :: Already You Pick up a Card from Deck ::`);
                            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                socket,
                                data: {
                                    isPopup: true,
                                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.PICK_UP_CARD_ALREADY_MESSAGE,
                                }
                            });
                        }
                    } else {
                        logger.warn(`----->> pickupCardFromOpenDeck :: wait for your turn  ::`);
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
                } else {
                    logger.warn(`----->> pickupCardFromOpenDeck :: table state is not turn start  ::`);
                    // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    //     socket,
                    //     data: {
                    //         isPopup: true,
                    //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    //         message: MESSAGES.POPUP.MIDDLE_TOAST_POP.TABLE_TURN_STATE_POPUP_MESSAGE,
                    //     }
                    // });
                }
            } else {
                // less than zero
                logger.warn(`----->> pickupCardFromOpenDeck :: open deck not available cards  ::`);
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.OPEN_DECK_CARD_AVAILABLE_POPUP_MESSAGE,
                    }
                });
            }
        } else {
            logger.warn(`----->> pickupCardFromOpenDeck :: ${THIRTEEN_CARDS_VALIDATION_MESSAGE} ::`);
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.THIRTEEN_CARDS_VALIDATION_MESSAGE,
                }
            })
        }
        logger.info("==============> open cards :: after <<==================", openCardsDeck.length)
    } catch (error: any) {
        logger.error("---pickCardFromOpenDeck :: ERROR: " + error)
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- pickCardFromOpenDeck :: InvalidInput :: ERROR ::",
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
                "--- pickCardFromOpenDeck :: CancelBattle :: ERROR ::",
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
                "--- pickCardFromOpenDeck :: UnknownError :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR) {
            logger.error(
                `--- pickCardFromOpenDeck :: ERROR_TYPE :: ${ERROR_TYPE.PICK_UP_FROM_OPEN_DECK_ERROR}::`,
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
            });
        } else {
            logger.error(
                "--- pickCardFromOpenDeck :: commonError :: ERROR ::",
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
                    title: GRPC_ERROR_REASONS.PICK_UP_FROM_OPEN_DECK_ERROR,
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
        await getLock().release(pickupCardFromOpenDeckLocks);
        logger.info("-=-=-=-=>> pickupCardFromOpenDeck :: lock relese ::")
    }
}

export = pickupCardFromOpenDeck;