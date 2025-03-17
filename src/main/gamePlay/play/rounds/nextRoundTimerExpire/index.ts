import { EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { NextRoundTimerQueueIf } from "../../../../interfaces/schedulerIf";
import startRound from "../startRound";


async function nextRoundStartTimerExpire(
    data: NextRoundTimerQueueIf
): Promise<void> {
    logger.info("------------------->> nextRoundStartTimerExpire <<----------------------------- ")
    const { timer, tableId, currentRound } = data;
    try {
        await startRound({
            timer,
            tableId,
            currentRound
        });
    } catch (error: any) {
        logger.error(
            "--- nextRoundStartTimerExpire :: commonError :: ERROR ::",
            error,
            `tableId : ${tableId}`
        );
        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
            tableId,
            data: {
                isPopup: true,
                popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                title: GRPC_ERROR_REASONS.NEXT_ROUND_TIMER_EXPIRE_ERROR,
                message: error && error.message && typeof error.message === 'string'
                    ? error.message
                    : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                buttonCounts: NUMERICAL.ONE,
                button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
            },
        }); logger.error("--- nextRoundStartTimerExpire :: ERROR :: ", error);
    }
}

export = nextRoundStartTimerExpire;