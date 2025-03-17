import config from "../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import formatSortCardInfo from "../../gamePlay/formatResponse/formatSortCardInfo";
import checkCardSequence from "../../gamePlay/play/cards/checkCardSequence";
import countTotalPoints from "../../gamePlay/utils/countTotalPoint";
import { endDragHelperRequestIf } from "../../interfaces/requestIf";
import { throwErrorIF } from "../../interfaces/throwError";
import { requestValidator } from "../../validator";
import Errors from "../../errors";
import countUserCards from "../../gamePlay/utils/countUserCards";
import { getLock } from "../../lock";


async function endDragHandler(
    { data }: endDragHelperRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("========================>> endDragHandler <<===========================")
    const endDragLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`], 2000);
    try {
        data = await requestValidator.endDragValidator(data);
        logger.info("----->> endDragHandler :: data :: ", data);
        logger.info("----->> endDragHandler :: data :: ", data);
        logger.info("----->> endDragHandler :: socket currentRound :: ", socket.eventMetaData.currentRound);

        const { cards, destinationGroupIndex } = data;
        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        if (cards.length === NUMERICAL.ONE) {
            const playerData = await getPlayerGamePlay(userId, tableId);

            if (playerData === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.END_DRAG_ERROR,
                    message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }
            logger.info("----->> endDragHandler :: playerData ::", playerData);

            const totalUserCards = await countUserCards(playerData.currentCards);
            logger.info("------> endDragHandler :: totalUserCards :: ", totalUserCards);

            if (totalUserCards > NUMERICAL.TWELVE) {
                const currentCards = playerData.currentCards;
                let newCurrentCards: string[][] = JSON.parse(JSON.stringify(currentCards));
                let isCardVailable = false;
                for await (const cardElem of cards) {
                    newCurrentCards.filter((card, index) => {
                        for (let i = 0; i < card.length; i++) {
                            if (cardElem === card[i]) {
                                newCurrentCards[index].splice(i, 1);
                                isCardVailable = true;
                            }
                        }
                    })
                }
                // if card vailable in player current cards
                if (isCardVailable) {

                    if (newCurrentCards[destinationGroupIndex]) {
                        newCurrentCards[destinationGroupIndex].splice(data.cardIndexInGroup, NUMERICAL.ZERO, data.cards[NUMERICAL.ZERO]);
                    } else {
                        newCurrentCards.push(cards);

                        if (newCurrentCards.length > NUMERICAL.SIX) {
                            newCurrentCards = currentCards;
                            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                socket,
                                data: {
                                    isPopup: true,
                                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.AUTO_GROPING_POPUP_MESSAGE,
                                }
                            });
                        }
                    }
                    
                    playerData.socketId = socket.id;
                    
                    const resCard = await checkCardSequence(newCurrentCards, playerData, tableId);
                    const totalPoints = await countTotalPoints(resCard);
                    const formatedEndDragCardResponce = await formatSortCardInfo(userId, tableId, totalPoints, resCard);

                    logger.info("========>> endDragHandler :: newCurrentCards <<======", newCurrentCards);
                    logger.info("========>> endDragHandler :: cardGroups <<=======", resCard);
                    logger.info("========>> endDragHandler :: formatedEndDragCardResponce <<======", formatedEndDragCardResponce);

                    commonEventEmitter.emit(EVENTS.END_DRAG_SOCKET_EVENT, {
                        socket,
                        data: formatedEndDragCardResponce
                    })
                } else {
                    logger.warn("========>> endDragHandler :: card not availble ::")
                    const resCard = await checkCardSequence(currentCards, playerData, tableId);
                    const totalPoints = await countTotalPoints(resCard);
                    const formatedEndDragCardResponce = await formatSortCardInfo(userId, tableId, totalPoints, resCard);

                    logger.info("========>> endDragHandler :: newCurrentCards <<======", newCurrentCards);
                    logger.info("========>> endDragHandler :: cardGroups <<=======", resCard);
                    logger.info("========>> endDragHandler :: formatedEndDragCardResponce <<======", formatedEndDragCardResponce);

                    commonEventEmitter.emit(EVENTS.END_DRAG_SOCKET_EVENT, {
                        socket,
                        data: formatedEndDragCardResponce
                    })
                    // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    //     socket,
                    //     data: {
                    //         isPopup: true,
                    //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    //         message: MESSAGES.POPUP.MIDDLE_TOAST_POP.CARD_ALREADY_DISCARDED_OR_NOT_AVAILABLE,
                    //     }
                    // })
                }
            } else {
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.MORE_THEN_TWELVE_VALIDATION_MESSAGE,
                    }
                })
            }
        } else {
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.END_DRAG_POPUP_MESSAGE,
                }
            });
        }

    } catch (error: any) {
        logger.error("---endDragHandler :: ERROR: ", error)

        let nonProdMsg = '';
        let errorCode = 500;
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- endDragHandler :: InvalidInput :: ERROR ::",
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
                "--- endDragHandler :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                data.userId
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
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
            });
        } else if (error && error.type === ERROR_TYPE.END_DRAG_ERROR) {
            logger.error(
                `--- endDragHandler :: ERROR_TYPE :: ${ERROR_TYPE.END_DRAG_ERROR}::`,
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
        } else if (error instanceof Errors.UnknownError) {
            nonProdMsg = 'GRPC_FAILED';
            logger.error(
                "--- endDragHandler :: UnknownError :: ERROR ::",
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
        } else {
            logger.error(
                "--- endDragHandler :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.END_DRAG_ERROR,
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
        await getLock().release(endDragLocks);
        logger.info("-=-=-=-=>> endDragHandler :: lock relese ::")
    }
}

export = endDragHandler;