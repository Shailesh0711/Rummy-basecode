import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { throwErrorIF } from "../../../../interfaces/throwError";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData } from "../../../cache/Rounds";
import { leaveRoundTable } from "../leaveRoundTable"
import Errors from "../../../../errors";
import commonEventEmitter from "../../../../commonEventEmitter";
import config from "../../../../../connections/config";
import { getTableData } from "../../../cache/Tables";


async function leaveTableTimeOut(data: any) {
    logger.info("------------->> leaveTableTimeOut <<-----------------")
    const { tableId, userId, currentRound } = data;
    let socketId: string = "";
    try {
        logger.info("----->> leaveTableTimeOut :: data :: ", data)
        await leaveRoundTable(true, true, userId, tableId, currentRound, true)

    } catch (error: any) {
        logger.error("---leaveTableTimeOut :: ERROR :: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- leaveTableTimeOut :: CancelBattle :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.LEAVE_TABLE_TIME_OUT_ERROR) {
            logger.error(
                `--- leaveTableTimeOut :: ERROR_TYPE :: ${ERROR_TYPE.LEAVE_TABLE_TIME_OUT_ERROR}::`,
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
                "--- leaveTableTimeOut :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: socketId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.LEAVE_TABLE_TIME_OUT_ERROR,
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

export = leaveTableTimeOut