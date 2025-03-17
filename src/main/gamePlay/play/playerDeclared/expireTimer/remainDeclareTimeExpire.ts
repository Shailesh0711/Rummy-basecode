import { EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { RemainPlayersdeclarTimerQueueIf } from "../../../../interfaces/schedulerIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData } from "../../../cache/Rounds";
import { autoDeclareRemainPlayers } from "..";
import Errors from "../../../../errors";
import commonEventEmitter from "../../../../commonEventEmitter";
import config from "../../../../../connections/config";

async function remainDeclareTimeExpire(
    data: RemainPlayersdeclarTimerQueueIf
): Promise<void> {
    logger.info("------->> remainDeclareTimeExpire <<--------")
    try {
        const { tableId, currentRound, otherPlayerDeclares } = data;

        for await (const player of otherPlayerDeclares) {
            const roundTableData = await getRoundTableData(tableId, currentRound);
            if (roundTableData.seats[`s${player.seatIndex}`].userStatus === PLAYER_STATE.PLAYING) {
                const userId = roundTableData.seats[`s${player.seatIndex}`].userId;
                await autoDeclareRemainPlayers(userId, tableId, currentRound);
            }
        }

    } catch (error: any) {
        logger.error("---remainDeclareTimeExpire :: ERROR :: " + error);
        let nonProdMsg = '';

        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- remainDeclareTimeExpire :: CancelBattle :: ERROR ::",
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
                "--- remainDeclareTimeExpire :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                data.tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.AUTO_DECLARE_REMAIN_PLAYERS_TIMER_EXPIRE_ERROR,
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

export = remainDeclareTimeExpire;