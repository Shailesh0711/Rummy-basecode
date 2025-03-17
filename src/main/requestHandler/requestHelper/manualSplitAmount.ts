import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, SPLIT_STATE, TABLE_STATE } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";
import splitAmount from "../../gamePlay/play/splitAmount";
import { getPlayersIds } from "../../gamePlay/play/splitAmount/helper";
import { manualSplitAmountEventHelperReqIf } from "../../interfaces/requestIf";
import { throwErrorIF } from "../../interfaces/throwError";
import Scheduler from "../../scheduler";
import { requestValidator } from "../../validator";
import Errors from "../../errors";
import config from "../../../connections/config";
import { getLock } from "../../lock";
import { getTableData } from "../../gamePlay/cache/Tables";

async function manualSplitAmountHandler(
    { data }: manualSplitAmountEventHelperReqIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("==================>> manualSplitAmountHandler <<=========================");
    const manualSplitAmountLocks = await getLock().acquire([`locks:${data.tableId}:${data.userId}`], 5000);
    try {
        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;

        logger.info("------->> manualSplitAmountHandler :: userId ::", userId);
        logger.info("------->> manualSplitAmountHandler :: tableId ::", tableId);
        logger.info("------->> manualSplitAmountHandler :: currentRound ::", currentRound);

        data = await requestValidator.manualSplitAmountValidator(data);
        logger.info("----->> manualSplitAmountHandler :: data :: ", data)

        const tableData = await getTableData(tableId);
        logger.info("------->> manualSplitAmountHandler :: tableData ::", tableData);

        if (tableData.currentRound !== currentRound) {
            return;
        }

        const roundTableData = await getRoundTableData(tableId, currentRound);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.MANUAL_SPLIT_AMOUNT_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> manualSplitAmountHandler :: roundTableData :: ", roundTableData)

        if (
            roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD &&
            roundTableData.isEligibleForSplit
        ) {
           
            const playerData = await getPlayerGamePlay(userId, tableId);
            if (playerData === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.MANUAL_SPLIT_AMOUNT_ERROR,
                    message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }
            logger.info("----->> manualSplitAmountHandler :: playerData :: ", playerData);
            
            await splitAmount(tableId, currentRound, false, false, userId);
        } else {
            // send ack popup notification
            logger.warn("----->> manualSplitAmountHandler :: Table State is not DISPLAY_SCOREBOARD")
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.MANUAL_SPLIT_MESSAGE,
                }
            });
        }
    } catch (error: any) {
        logger.info("--- manualSplitAmountHandler :: ERROR ::", error);
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- manualSplitAmountHandler :: InvalidInput :: ERROR ::",
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
            })
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- manualSplitAmountHandler :: CancelBattle :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.MANUAL_SPLIT_AMOUNT_ERROR) {
            logger.error(
                `--- manualSplitAmountHandler :: ERROR_TYPE :: ${ERROR_TYPE.MANUAL_SPLIT_AMOUNT_ERROR}::`,
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
                "--- manualSplitAmountHandler :: commonError :: ERROR ::",
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
                    title: GRPC_ERROR_REASONS.MANUAL_AMOUNT_SPLIT_ERROR,
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
        await getLock().release(manualSplitAmountLocks);
        logger.info("-=-=-=-=>> manualSplitAmountHandler :: lock relese ::")
    }
}

export = manualSplitAmountHandler;