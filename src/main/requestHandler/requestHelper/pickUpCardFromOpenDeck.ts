import { EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import pickupCardFromOpenDeck from "../../gamePlay/play/cards/pickupCardFromOpenDeck";
import { pickUpCardFromOpenDecHelperRequestIf } from "../../interfaces/requestIf";
import { requestValidator } from "../../validator";
import Errors from "../../errors";


async function pickUpCardFromOpenDeckHandler(
    { data }: pickUpCardFromOpenDecHelperRequestIf,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.debug("===========>> pickUpCardFromOpenDeckHandler <<===============")
    try {
        data = await requestValidator.pickUpCardFromOpenDeckValidator(data)
        logger.info("----->> pickUpCardFromOpenDeckHandler :: data :: ", data);
        
        await pickupCardFromOpenDeck(data, socket, ack);
    } catch (error: any) {
        logger.error("---pickUpCardFromOpenDeckHandler :: ERROR: ", error)
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- pickUpCardFromOpenDeckHandler :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableID :: ${data.tableId}`
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
        } else {
            logger.error(
                "--- pickUpCardFromOpenDeckHandler :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableID :: ${data.tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.PICK_UP_FROM_OPEN_DECK_ERROR,
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

export = pickUpCardFromOpenDeckHandler;