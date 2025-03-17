import { EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { StartFinishTimerQueueIf } from "../../../../interfaces/schedulerIf";
import { autoDeclareFinishDeckUser } from "..";
import Errors from "../../../../errors";
import config from "../../../../../connections/config";


async function startFinishTimerExpire(
    data: StartFinishTimerQueueIf
): Promise<void> {
    logger.info("================>> startFinishTimerExpire <<================")
    try {
        const { userId, tableId, currentRound } = data;
        logger.info("--------->> startFinishTimerExpire :: data :: ", data)
        await autoDeclareFinishDeckUser(userId, tableId, currentRound);

    } catch (error: any) {
        console.log("---startFinishTimerExpire :: ERROR ::",error)
        logger.error("---startFinishTimerExpire :: ERROR :: " + error)

        let nonProdMsg = '';

        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- startFinishTimerExpire :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                data.tableId
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
        } else {
            logger.error(
                "--- startFinishTimerExpire :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                data.tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.AUTO_DECLARE_FINISH_TIMER_EXPIRE_ERROR,
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

export = startFinishTimerExpire;