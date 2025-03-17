import { EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { reShuffleCardQueueIf } from "../../../interfaces/schedulerIf";
import { nextPlayerTurn } from "../turn/nextPlayerTurn";


async function reShuffleCards(
    data: reShuffleCardQueueIf
): Promise<void> {
    logger.info("================>> reShuffleCards <<=====================")
    try {
        const info = {
            timer: data.timer,
            tableId: data.tableId,
            currentTurnPlayerId: data.currentTurnPlayerId,
            currentRound: data.currentRound,
            currentPlayerSeatIndex: data.currentPlayerSeatIndex
        }
        await nextPlayerTurn(info)
    } catch (error: any) {
        logger.error("---reShuffleCards :: ERROR", error);
        logger.error(
            "--- reShuffleCards :: commonError :: ERROR ::",
            error,
            "userId :: ",
            data.currentTurnPlayerId,
            `tableId :: ${data.tableId}`
        );
        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
            tableId: data.tableId,
            data: {
                isPopup: true,
                popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                title: GRPC_ERROR_REASONS.RE_SHUFFLE_CARDS_ERROR,
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

export = reShuffleCards;