import {
    ERROR_TYPE,
    EVENTS,
    GRPC_ERROR_REASONS,
    MESSAGES,
    NUMERICAL,
    RUMMY_TYPES,
} from "../../../../constants";
import commonEventEmitter from "../../../commonEventEmitter";
import { getPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData } from "../../cache/Rounds";
import logger from "../../../../logger";
import { throwErrorIF } from "../../../interfaces/throwError";
import Errors from "../../../errors";
import { getTableData } from "../../cache/Tables";
import { poolRummyFinishingUser } from "./helper/poolRummyFinishingUser";
import { dealRummyFinishingUser } from "./helper/dealRummyFinishingUser";
import { pointRummyFinishingUser } from "./helper/pointRummyFinishingUser";

async function autoDeclareFinishDeckUser(
    userId: string,
    tableId: string,
    currentRound: number
): Promise<void> {
    logger.info(
        "======================>> autoDeclareFinishDeckUser <<====================="
    );
    logger.info(
        "======>> autoDeclareFinishDeckUser <<========",
        `userId :: ${userId}`,
        `tableId :: ${tableId}`,
        `currentRound :: ${currentRound}`
    );
    let socketId: string = "";
    try {
        const tableData = await getTableData(tableId);
        logger.info(`----->> autoDeclareFinishDeckUser :: tableData ::`, tableData);

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info(
            `----->> autoDeclareFinishDeckUser :: roundTableData ::`,
            roundTableData
        );

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.AUTO_DECLARE_FINISH_TIMER_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const playerData = await getPlayerGamePlay(userId, tableId);
        logger.info(
            `----->> autoDeclareFinishDeckUser :: playerData ::`,
            playerData
        );
        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.AUTO_DECLARE_FINISH_TIMER_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        socketId = playerData.socketId;
        logger.info(
            `----->> autoDeclareFinishDeckUser :: RUMMY_TYPES ::`,
            tableData.rummyType
        );

        switch (tableData.rummyType) {
            case RUMMY_TYPES.POINT_RUMMY:
                await pointRummyFinishingUser(userId, tableId, currentRound, playerData, roundTableData);
                break;

            case RUMMY_TYPES.POOL_RUMMY:
                await poolRummyFinishingUser(userId, tableId, currentRound, playerData, roundTableData);
                break;

            case RUMMY_TYPES.DEALS_RUMMY:
                await dealRummyFinishingUser(userId, tableId, currentRound, playerData, roundTableData);
                break;

            default:
                logger.info("<<====== Default :: nextRoundStart :: Call ========>>");
                break;
        }
    } catch (error: any) {
        logger.error("---autoDeclareFinishDeckUser :: ERROR :: ", error);
        let nonProdMsg = "";

        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- autoDeclareFinishDeckUser :: CancelBattle :: ERROR ::",
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
                    popupType: MESSAGES.POPUP.COMMAN_TOAST_POPUP
                        .CANCEL_BATTELE_POPUP_MESSAGE
                        ? MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE
                        : MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message:
                        error && error.message && typeof error.message === "string"
                            ? error.message
                            : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        } else if (
            error &&
            error.type === ERROR_TYPE.AUTO_DECLARE_FINISH_TIMER_ERROR
        ) {
            logger.error(
                `--- autoDeclareFinishDeckUser :: ERROR_TYPE :: ${ERROR_TYPE.AUTO_DECLARE_FINISH_TIMER_ERROR}::`,
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
                    message:
                        error && error.message && typeof error.message === "string"
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
                "--- autoDeclareFinishDeckUser :: commonError :: ERROR ::",
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
                    title: GRPC_ERROR_REASONS.AUTO_DECLARE_FINISH_TIMER_ERROR,
                    message:
                        error && error.message && typeof error.message === "string"
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

export = autoDeclareFinishDeckUser;
