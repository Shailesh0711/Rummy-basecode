import config from "../../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { pickupCardFromCloseDeckRequestIf } from "../../../interfaces/requestIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import formatPickupCloseDeck from "../../formatResponse/formatPickupCloseDeck";
import formatReShuffleDeckInfo from "../../formatResponse/formatReShuffleDeckInfo";
import countTotalPoints from "../../utils/countTotalPoint";
import countUserCards from "../../utils/countUserCards";
import checkCardSequence from "./checkCardSequence";
import shuffleCards from "./shuffleCards";
import Errors from "../../../errors";
import { getLock } from "../../../lock";

async function pickupCardFromCloseDeck(
    data: pickupCardFromCloseDeckRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("================>> pickupCardFromCloseDeck <<=========================")
    const pickupCardFromCloseDeckLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`, `locks:${data.userId}`], 2000);
    try {
        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        const roundTableData = await getRoundTableData(tableId, currentRound);
        const playerData = await getPlayerGamePlay(userId, tableId);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_CLOSE_DECK_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> pickupCardFromCloseDeck :: roundTableData ::`, roundTableData)

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PICK_UP_FROM_CLOSE_DECK_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`---pickupCardFromCloseDeck :: playerData ::`, playerData);

        let closeCardsDeck: string[] = JSON.parse(JSON.stringify(roundTableData.closedDeck));

        const lastIndexOfCurrentCards = playerData.currentCards.length - NUMERICAL.ONE;
        const currentCard = playerData.currentCards

        logger.info("=========> pickupCardFromCloseDeck :: close cards :: before <<=========", closeCardsDeck.length);
        logger.info("=========> pickupCardFromCloseDeck :: lastIndexOfCurrentCards <<=========", lastIndexOfCurrentCards);

        if (closeCardsDeck.length === NUMERICAL.ONE) {
            let openCardsDeck: string[] = JSON.parse(JSON.stringify((roundTableData.opendDeck)));

            const opendDeckLastCardIndex = openCardsDeck.length - NUMERICAL.ONE;
            const opendDeckLastCard = openCardsDeck[opendDeckLastCardIndex];

            roundTableData.opendDeck = [];
            roundTableData.opendDeck.push(opendDeckLastCard);
            openCardsDeck.splice(opendDeckLastCardIndex, NUMERICAL.ONE);

            const closedCardsDeck = await shuffleCards(openCardsDeck);

            roundTableData.closedDeck = closedCardsDeck;
            closeCardsDeck = closedCardsDeck
            await setRoundTableData(tableId, currentRound, roundTableData);
            logger.info("----->> pickupCardFromCloseDeck :: ReShuffle :: closedDeck :: ", closeCardsDeck);
        }

        const totalUserCards = await countUserCards(playerData.currentCards);
        logger.info("======> pickupCardFromCloseDeck :: totalUserCards <<=========", totalUserCards);
        if (playerData.isTurn) {
            if (totalUserCards === NUMERICAL.THIRTEEN) {
                if (closeCardsDeck.length > NUMERICAL.ZERO) {
                    if (roundTableData.tableState === TABLE_STATE.TURN_STARTED) {
                        if (playerData.userStatus === PLAYER_STATE.PLAYING && playerData.isTurn && playerData.playingStatus === PLAYER_STATE.CARD_DISTRIBUTION) {
                            if (!playerData.isCardPickUp) {

                                const playerDataInfo = await getPlayerGamePlay(userId, tableId);

                                const ran = Math.floor(Math.random() * closeCardsDeck.length);
                                const card = closeCardsDeck[ran];
                                closeCardsDeck.splice(ran, NUMERICAL.ONE);
                                roundTableData.closedDeck = closeCardsDeck;
                                currentCard[lastIndexOfCurrentCards].push(card);

                                logger.info(`----->> pickupCardFromCloseDeck :: card ::`, card);
                                logger.info(`----->> pickupCardFromCloseDeck :: currentCards ::`, currentCard);

                                await setRoundTableData(tableId, currentRound, roundTableData);

                                playerDataInfo.lastPickCard = card;
                                playerDataInfo.lastCardPickUpScource = PLAYER_STATE.CLOSE_DECK;
                                playerDataInfo.isCardPickUp = true;
                                playerDataInfo.socketId = socket.id;
                                playerDataInfo.countTurns += NUMERICAL.ONE;
                                playerDataInfo.remainMissingTurn = NUMERICAL.THREE;

                                const resCard = await checkCardSequence(currentCard, playerDataInfo, tableId)
                                const totalPoints = await countTotalPoints(resCard);
                                const formatedGroupCardResponce = await formatPickupCloseDeck(userId, tableId, playerData.seatIndex, totalPoints, resCard, card);

                                logger.info(`----->> pickupCardFromCloseDeck :: checkCardSequence ::`, resCard);
                                logger.info(`----->> pickupCardFromCloseDeck :: totalPoints ::`, totalPoints);
                                logger.info(`----->> pickupCardFromCloseDeck :: formatPickupCloseDeck ::`, formatedGroupCardResponce);

                                commonEventEmitter.emit(EVENTS.PICK_CARD_FROM_CLOSE_DECK, {
                                    tableId,
                                    data: formatedGroupCardResponce
                                });

                            } else {
                                logger.warn("------->> pickupCardFromCloseDeck :: Already You Pick up a Card from close Deck :: ", `userId:${userId} and TableId:${tableId}`);
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
                            logger.warn("------->> pickupCardFromCloseDeck :: Wait for your Turn :: ", `userId:${userId} and TableId:${tableId}`);
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
                        logger.warn("------->> pickupCardFromCloseDeck :: Table State is not Turn Start :: ", `userId:${userId} and TableId:${tableId}`);
                    }
                } else {
                    logger.warn("------->> pickupCardFromCloseDeck :: close card deck haven't Cards :: ", `userId:${userId} and TableId:${tableId}`);

                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            message: MESSAGES.POPUP.MIDDLE_TOAST_POP.CLOSE_DECK_EMPTY_MESSAGE,
                        }
                    })
                }
            } else {
                logger.warn("------->> pickupCardFromCloseDeck :: already pickup a card Or Havan't thirteen cards :: ", `userId:${userId} and TableId:${tableId}`);
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
        } else {
            // wait for your turn
            logger.warn("------->> pickupCardFromCloseDeck :: wait for your turn :: 1 ::", `userId:${userId} and TableId:${tableId}`);
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
        logger.info("==============> close cards :: after <<==================", closeCardsDeck.length)
    } catch (error: any) {
        logger.error("---pickupCardFromCloseDeck :: ERROR: " + error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- pickupCardFromCloseDeck :: CancelBattle :: ERROR ::",
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
                "--- pickupCardFromCloseDeck :: UnknownError :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.PICK_UP_FROM_CLOSE_DECK_ERROR) {
            logger.error(
                `--- pickupCardFromCloseDeck :: ERROR_TYPE :: ${ERROR_TYPE.PICK_UP_FROM_CLOSE_DECK_ERROR}::`,
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
                "--- pickupCardFromCloseDeck :: commonError :: ERROR ::",
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
                    title: GRPC_ERROR_REASONS.PICK_UP_FROM_CLOSE_DECK_ERROR,
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

        // if (error && error.type === MESSAGES.ALERT_MESSAGE.POPUP_TYPE) {
        //     commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        //         socket,
        //         data: {
        //             isPopup: true,
        //             popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
        //             title: error.title,
        //             message: error.reason,
        //             buttonCounts: error.buttonCount,
        //             button_text: error.button_text,
        //             button_color: error.button_color,
        //             button_methods: error.button_methods,
        //             showLoader: error.showLoader,
        //         }
        //     })
        // }

    } finally {
        await getLock().release(pickupCardFromCloseDeckLocks);
        logger.info("-=-=-=-=>> discardCardHandler :: lock relese ::")
    }
}


export = pickupCardFromCloseDeck