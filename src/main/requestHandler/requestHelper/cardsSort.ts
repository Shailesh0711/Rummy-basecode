import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, TABLE_STATE } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import { setCardSuitWise } from "../../gamePlay/play/cards";
import checkCardSequence from "../../gamePlay/play/cards/checkCardSequence";
import countTotalPoints from "../../gamePlay/utils/countTotalPoint";
import { cardsSortHelperRequestIf } from "../../interfaces/requestIf";
import { requestValidator } from "../../validator";
import Errors from "../../errors";
import formatSortCardInfo from "../../gamePlay/formatResponse/formatSortCardInfo";
import { throwErrorIF } from "../../interfaces/throwError";
import config from "../../../connections/config";
import countUserCards from "../../gamePlay/utils/countUserCards";
import { cards } from "../../interfaces/cards";
import { getLock } from "../../lock";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";


async function cardsSortHandler(
    { data }: cardsSortHelperRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("==========>> cardsSortHandler <<=============");
    const { tableId } = data;
    const cardsSortLocks = await getLock().acquire([`locks:${tableId}:${data.userId}`], 5000);
    try {
        data = await requestValidator.cardsSortValidator(data);

        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;


        logger.info("----->> cardsSortHandler :: userId ::", userId);
        logger.info("----->> cardsSortHandler :: tableId ::", tableId);
        logger.info("----->> cardsSortHandler :: currentRound ::", currentRound);

        const playerData = await getPlayerGamePlay(userId, tableId);
        logger.info("----->> cardsSortHandler :: playerData ::", playerData);

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.CARDS_SORT_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("----->> cardsSortHandler :: playerData ::", playerData);

        if (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD) {
            const cards = playerData.currentCards

            const totalUserCards = await countUserCards(playerData.currentCards);
            logger.info("======> cardsSortHandler :: totalUserCards <<=========", totalUserCards);

            if (totalUserCards > NUMERICAL.TWELVE) {
                let newCardArr = [];
                for (let i = NUMERICAL.ZERO; i < cards.length; i++) {
                    newCardArr.push(...cards[i]);
                }
                const formatedCards = await setCardSuitWise(newCardArr);
                const card: cards[] = await checkCardSequence(formatedCards, playerData, tableId);
                const totalPoints = await countTotalPoints(card);

                logger.info("---cardsSortHandler :: setCardSuitWise ::", formatedCards);
                logger.info("---cardsSortHandler :: card ::", card);
                logger.info("---cardsSortHandler :: totalPoint ::", totalPoints);

                const formatedSortCardResponce = await formatSortCardInfo(userId, tableId, totalPoints, card);
                logger.info("---cardsSortHandler :: formatSortCardInfo ::", formatedSortCardResponce);

                commonEventEmitter.emit(EVENTS.CARDS_IN_SORTS, {
                    socket,
                    data: formatedSortCardResponce
                });

            } else {
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.MORE_THEN_TWELVE_VALIDATION_MESSAGE,
                    }
                });
            }
        }

    } catch (error: any) {
        console.log("---cardSortHandler :: ERROR: ", error);
        logger.error("---cardSortHandler :: ERROR: ", error);
        let nonProdMsg = '';
        let msg = MESSAGES.GRPC_ERRORS.COMMON_ERROR;
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- cardSortHandler :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${tableId}`
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
                "--- cardSortHandler :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${tableId}`
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
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
                "--- cardSortHandler :: UnknownError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${tableId}`
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
        } else if (error && error.type === ERROR_TYPE.CARDS_SORT_ERROR) {
            logger.error(
                `--- cardSortHandler :: ERROR_TYPE :: ${ERROR_TYPE.CARDS_SORT_ERROR}::`,
                error,
                "userId :: ",
                data.userId,
                `tableId : ${tableId}`
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
                "--- cardSortHandler :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.SORT_CARDS_ERROR,
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
        if (cardsSortLocks) {
            await getLock().release(cardsSortLocks);
            logger.info("-=-=-=-=>> cardsSortHandler :: lock relese ::")
        }
    }
}

export = cardsSortHandler;