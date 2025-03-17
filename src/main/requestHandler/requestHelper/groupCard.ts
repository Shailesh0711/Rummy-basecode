import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import formatSortCardInfo from "../../gamePlay/formatResponse/formatSortCardInfo";
import checkCardSequence from "../../gamePlay/play/cards/checkCardSequence";
import countTotalPoints from "../../gamePlay/utils/countTotalPoint";
import Errors from "../../errors";
import { groupCardHelperRequestIf } from "../../interfaces/requestIf";
import { requestValidator } from "../../validator";
import groupCardSort from "../../gamePlay/play/cards/groupCardSort";
import { throwErrorIF } from "../../interfaces/throwError";
import config from "../../../connections/config";
import countUserCards from "../../gamePlay/utils/countUserCards";
import { getLock } from "../../lock";
import cloneCardFilter from "../../gamePlay/utils/cloneCardFilter";


async function groupCardHandler(
    { data }: groupCardHelperRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("==========================>> groupCardHandler <<========================");
    const { CANCEL_BATTELE_POPUP_MESSAGE } = config()
    const groupCardLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`], 5000);
    try {

        data = await requestValidator.groupCardValidator(data);
        logger.info("----->> groupCardHandler :: data :: ", data);

        let { cards } = data;
        cards = await cloneCardFilter(cards);
        console.log("------>> groupCardHandler :: data :: cards :: ", cards);
        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        if (cards.length > NUMERICAL.ONE) {
            const playerData = await getPlayerGamePlay(userId, tableId)
            if (playerData === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.GROUP_CARDS_ERROR,
                    message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }
            logger.info("----->> groupCardHandler :: playerData ::", playerData);

            const totalUserCards = await countUserCards(playerData.currentCards);
            logger.info("----->> groupCardHandler :: totalUserCards :: ", totalUserCards);

            if (totalUserCards > NUMERICAL.TWELVE) {

                const currentCards = playerData.currentCards;
                let newCurrentCards: string[][] = JSON.parse(JSON.stringify(currentCards));

                for await (const ele of cards) {
                    newCurrentCards.find((cards, index) => {
                        for (let i = NUMERICAL.ZERO; i < cards.length; i++) {
                            if (cards[i] === ele) {
                                newCurrentCards[index].splice(i, NUMERICAL.ONE);
                            }
                        }
                    })
                }

                logger.info("----->> groupCardHandler :: newCurrentCards ::", newCurrentCards);

                let cardsWithOutNewGroup = newCurrentCards.filter((card) => {
                    if (card.length > NUMERICAL.ZERO) {
                        return card
                    }
                })

                logger.info("----->> groupCardHandler :: newCurrentCards :: filter :: ", cardsWithOutNewGroup);

                logger.info("----->> groupCardHandler :: cards :: ", cards);
                const sortCard = await groupCardSort(cards);
                logger.info("----->> groupCardHandler :: sortCard :: ", sortCard);
                cardsWithOutNewGroup.push(sortCard);
                logger.info("----->> groupCardHandler :: newCurrentCards :: add card :: ", cardsWithOutNewGroup);


                if (cardsWithOutNewGroup.length > NUMERICAL.SIX) {
                    logger.info("----->> groupCardHandler :: group more then five :: Legnth ::", cardsWithOutNewGroup.length);
                    cardsWithOutNewGroup = playerData.currentCards;
                    // not generat more than six groups of cards
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

                const resCard = await checkCardSequence(cardsWithOutNewGroup, playerData, tableId)
                logger.info("---groupCardHandler :: checkCardSequence ::", resCard);

                const totalPoints = await countTotalPoints(resCard);
                logger.info("---groupCardHandler :: totalPoints ::", totalPoints);

                const formatedGroupCardResponce = await formatSortCardInfo(userId, tableId, totalPoints, resCard);
                logger.info("---groupCardHandler :: formatSortCardInfo ::", formatedGroupCardResponce);

                commonEventEmitter.emit(EVENTS.GROUP_CARD_SOCKET_EVENT, {
                    socket,
                    data: formatedGroupCardResponce
                });

            } else {
                logger.warn("----->> groupCardHandler :: need more then twelve cards ::");
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
            logger.warn("----->> groupCardHandler :: Need More Than One Cards ::");
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.GROUP_CARDS_VALIDATION_MESSAGE,
                }
            });
        }

    } catch (error: any) {
        logger.error("---groupCardHandler :: ERROR: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            logger.error(
                "--- groupCardHandler :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId :: ${data.tableId}`
            );
            nonProdMsg = "Invalid Input";
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
                "--- groupCardHandler :: CancelBattle :: ERROR ::",
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
            });
        } else if (error && error.type === ERROR_TYPE.GROUP_CARDS_ERROR) {
            logger.error(
                `--- groupCardHandler :: ERROR_TYPE :: ${ERROR_TYPE.GROUP_CARDS_ERROR}::`,
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
        } else if (error instanceof Errors.UnknownError) {
            nonProdMsg = 'GRPC_FAILED';
            logger.error(
                "--- groupCardHandler :: UnknownError :: ERROR ::",
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
        } else {
            logger.error(
                "--- groupCardHandler :: commonError :: ERROR ::",
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
                    title: GRPC_ERROR_REASONS.GROUP_CARDS_ERROR,
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
        await getLock().release(groupCardLocks);
        logger.info("-=-=-=-=>> groupCardHandler :: lock relese ::")
    }
}

export = groupCardHandler;