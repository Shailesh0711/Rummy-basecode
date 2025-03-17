import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { getPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData } from "../../cache/Rounds";
import { throwErrorIF } from "../../../interfaces/throwError";
import commonEventEmitter from "../../../commonEventEmitter";
import Errors from "../../../errors";
import { getTableData } from "../../cache/Tables";
import { poolRummyRemainPlayerDeclare } from "./helper/poolRummyRemainPlayerDeclare";
import { dealRummyRemainPlayerDeclare } from "./helper/dealRummyRemainPlayerDeclare";
import { pointRummyRemainPlayerDeclare } from "./helper/pointRummyRemainPlayerDeclare";

async function autoDeclareRemainPlayers(
    userId: string,
    tableId: string,
    currentRound: number,
): Promise<void> {
    logger.info("================>> autoDeclareRemainPlayers <<=====================");
    let socketId: string = "";
    try {
        const tableData = await getTableData(tableId);
        logger.info(`----->> autoDeclareRemainPlayers :: tableData ::`, tableData)

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info(`----->> autoDeclareRemainPlayers :: roundTableData ::`, roundTableData)

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.AUTO_DECLARE_REMAIN_TIMER_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const playerData = await getPlayerGamePlay(userId, tableId);
        logger.info(`----->> autoDeclareRemainPlayers :: playerData ::`, playerData);
        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.AUTO_DECLARE_REMAIN_TIMER_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        socketId = playerData.socketId;

        logger.info(`----->> autoDeclareRemainPlayers :: RUMMY_TYPES ::`, tableData.rummyType);

        switch (tableData.rummyType) {

            case RUMMY_TYPES.POINT_RUMMY:
                await pointRummyRemainPlayerDeclare(userId, tableId, tableData.currentRound, playerData, roundTableData)
                break;

            case RUMMY_TYPES.POOL_RUMMY:
                await poolRummyRemainPlayerDeclare(userId, tableId, tableData.currentRound, playerData, roundTableData)
                break;

            case RUMMY_TYPES.DEALS_RUMMY:
                await dealRummyRemainPlayerDeclare(userId, tableId, tableData.currentRound, playerData, roundTableData)
                break;

            default:
                logger.info("<<====== Default :: autoDeclareRemainPlayers :: Call ========>>");
                break;
        }

    } catch (error: any) {
        logger.error("---autoDeclareRemainPlayers :: ERROR: " + error)
        let nonProdMsg = '';

        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- autoDeclareRemainPlayers :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
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
        } else if (error && error.type === ERROR_TYPE.AUTO_DECLARE_REMAIN_TIMER_ERROR) {
            logger.error(
                `--- autoDeclareRemainPlayers :: ERROR_TYPE :: ${ERROR_TYPE.AUTO_DECLARE_REMAIN_TIMER_ERROR}::`,
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: tableId,
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
                "--- autoDeclareRemainPlayers :: commonError :: ERROR ::",
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: socketId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.AUTO_DECLARE_REMAIN_PLAYERS_TIMER_ERROR,
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

export = autoDeclareRemainPlayers;