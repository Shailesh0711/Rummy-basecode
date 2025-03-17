import { EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { scoreBoardTimerIf } from "../../../../interfaces/schedulerIf";
import { nextRoundStart } from "../../rounds";
import Errors from "../../../../errors";
import config from "../../../../../connections/config";
import splitAmount from "../../splitAmount";


async function scoreBoardTimerExpire(
    data: scoreBoardTimerIf
): Promise<void> {
    const { tableId, isAutoSplit, currentRound } = data;
    try {
        if (isAutoSplit) {
            await splitAmount(tableId, currentRound, false, true);
        } else {
            await nextRoundStart(tableId, currentRound);
        }
    } catch (error: any) {
        logger.error("---scoreBoardTimerExpire :: ERROR :: " + error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- scoreBoardTimerExpire :: CancelBattle :: ERROR ::",
                error,
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
        } else {
            logger.error(
                "--- scoreBoardTimerExpire :: commonError :: ERROR ::",
                error,
                `tableId : ${tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.SCORE_BOARD_TIMER_EXPIRE_ERROR,
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

export = scoreBoardTimerExpire;