import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, RUMMY_TYPES } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getScoreBoardHistory } from "../../gamePlay/cache/ScoreBoardHistory";
import formatViewScoreBoardInfo from "../../gamePlay/formatResponse/formatViewScoreBoardInfo";
import { formatScoreBoardInfoIf } from "../../interfaces/responseIf";
import { requestValidator } from "../../validator";
import Errors from "../../errors";
import config from "../../../connections/config";
import { throwErrorIF } from "../../interfaces/throwError";
import { viewScoreBoardEventHelperReqIf } from "../../interfaces/requestIf";
import { getLock } from "../../lock";
import { getTableData } from "../../gamePlay/cache/Tables";

async function viewviewScoreBoardHandler(
    { data }: viewScoreBoardEventHelperReqIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("==============>> viewScoreBoardHandler <<=================");
    const viewScoreBoardLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`], 5000);
    try {
        data = await requestValidator.scoreBoardValidator(data);
        logger.info("------->> viewScoreBoardHandler :: data :: ", data);

        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;
        const userId = socket.eventMetaData.userId || data.userId;

        logger.info("------->> viewScoreBoardHandler :: tableId :: ", tableId);
        logger.info("------->> viewScoreBoardHandler :: currentRound :: ", currentRound);
        logger.info("------->> viewScoreBoardHandler :: userId :: ", userId);


        const tableData = await getTableData(tableId);
        logger.info("------->> viewScoreBoardHandler :: tableData.rummyType :: ", tableData.rummyType);

        if (tableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
            const scoreBoardData = await getScoreBoardHistory(userId);

            if (!scoreBoardData) {
                logger.warn("-------->> viewScoreBoardHandler :: wait until round finish");
                // wait for round to finish
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.VIEW_SCORE_BOARD_MESSAGE,
                    }
                });
            } else {
                logger.info("------->> viewScoreBoardHandler :: scoreBoardData :: ", scoreBoardData)
                const ScoreBoardHistory: formatScoreBoardInfoIf = scoreBoardData[`${userId}`];
                ScoreBoardHistory.isLastDeal = true;
                logger.info("------->> viewScoreBoardHandler :: ScoreBoardHistory :: ", ScoreBoardHistory);

                commonEventEmitter.emit(EVENTS.LAST_DEAL, {
                    socket,
                    data: ScoreBoardHistory
                });
            }
        } else {
            if (currentRound === NUMERICAL.ONE) {
                logger.warn("-------->> viewScoreBoardHandler :: wait until round finish");
                // wait for round to finish
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.MIDDLE_TOAST_POP.VIEW_SCORE_BOARD_MESSAGE,
                    }
                });
            } else {
                const boardRound = currentRound - NUMERICAL.ONE;
                logger.info("------->> viewScoreBoardHandler :: boardRound :: ", boardRound)
                const scoreBoardData = await getScoreBoardHistory(tableId);
                if (scoreBoardData === null) {
                    const errorObj: throwErrorIF = {
                        type: ERROR_TYPE.VIEW_SCORE_BOARD_ERROR,
                        message: MESSAGES.ERROR.VIEW_SCORE_BOARD_ERROR_MESSAGES,
                        isCommonToastPopup: true,
                    };
                    throw errorObj;
                }
                logger.info("------->> viewScoreBoardHandler :: scoreBoardData :: ", scoreBoardData)

                const ScoreBoardHistory: formatScoreBoardInfoIf = scoreBoardData[`Round${boardRound}`];
                ScoreBoardHistory.isLastDeal = true;
                logger.info("------->> viewScoreBoardHandler :: ScoreBoardHistory :: ", ScoreBoardHistory);

                commonEventEmitter.emit(EVENTS.LAST_DEAL, {
                    socket,
                    data: ScoreBoardHistory
                });
            }
        }
    } catch (error: any) {
        logger.error("---viewScoreBoardHandler :: ERROR :: ", error);
        let nonProdMsg = '';
        let msg = MESSAGES.GRPC_ERRORS.COMMON_ERROR;
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- viewScoreBoardHandler :: InvalidInput :: ERROR ::",
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
                "--- viewScoreBoardHandler :: CancelBattle :: ERROR ::",
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
                "--- viewScoreBoardHandler :: UnknownError :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.VIEW_SCORE_BOARD_ERROR) {
            logger.error(
                `--- viewScoreBoardHandler :: ERROR_TYPE :: ${ERROR_TYPE.VIEW_SCORE_BOARD_ERROR}::`,
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
                "--- viewScoreBoardHandler :: commonError :: ERROR ::",
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
                    title: GRPC_ERROR_REASONS.VIEW_SCORE_BOARD_ERROR,
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
        await getLock().release(viewScoreBoardLocks);
        logger.info("-=-=-=-=>> viewviewScoreBoardHandler :: lock relese ::")
    }
}


export = viewviewScoreBoardHandler;