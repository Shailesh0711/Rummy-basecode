import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import declared from "../../gamePlay/play/playerDeclared/declared";
import { declareHelperRequestIf } from "../../interfaces/requestIf";
import { StartFinishTimerCancel } from "../../scheduler/cancelJob";
import { requestValidator } from "../../validator";
import Errors from "../../errors";
import Scheduler from "../../scheduler";
import config from "../../../connections/config";
import { getLock } from "../../lock";


async function declareHandler(
    { data }: declareHelperRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("-------------------------->> declareHandler <<---------------------------")
    try {
        data = await requestValidator.declareValidator(data);
        logger.info("---------->> declareHandler :: data :: ", data)
        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        await declared(userId, tableId, currentRound);

    } catch (error: any) {
        logger.error("---declareHandler :: ERROR: " + error);
        let nonProdMsg = '';
        let errorCode = 500;
        let msg = MESSAGES.GRPC_ERRORS.COMMON_ERROR;
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- declareHandler :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
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
            });
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- declareHandler :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE?
                        MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
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
                "--- declareHandler :: UnknownError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
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
        } else if (error && error.type === ERROR_TYPE.DECLARE_ERROR) {
            logger.error(
                `--- declareHandler :: ERROR_TYPE :: ${ERROR_TYPE.DECLARE_ERROR}::`,
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
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
                "--- declareHandler :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.DECLARE_EVENT_ERROR,
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

export = declareHandler;