import logger from "../../../logger";
import { getUser } from "../cache/User";
import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL } from "../../../constants";
import commonEventEmitter = require("../../commonEventEmitter");
import Errors from "../../errors"
import { matchMakingIf } from "../../interfaces/requestIf";
import { throwErrorIF } from "../../interfaces/throwError";
import { insertNewPlayer } from "./insertPlayer";


async function matchMaking(data: matchMakingIf, socket: any, ack?: Function): Promise<void> {
    logger.info("===================>> Matchmaking <<=====================")
    const { userId } = socket.eventMetaData;
    const { lobbyId } = data;
    try {
        const getUserData = await getUser(userId);
        if (getUserData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.MATCH_MACKING_ERROR,
                message: MESSAGES.ERROR.USER_DETAIL_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        logger.info("-------->> Matchmaking :: getUserData :: ", getUserData);

        if (ack) {
            await insertNewPlayer(getUserData, socket, ack);
        }

    } catch (error: any) {
        logger.error("MATCH MACKING :: ERROR ::", error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- matchMaking :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                socket.userId
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
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

        } else if (error && error.type === ERROR_TYPE.MATCH_MACKING_ERROR) {
            logger.error(
                `--- matchMaking :: ERROR_TYPE :: ${ERROR_TYPE.MATCH_MACKING_ERROR}::`,
                error,
                "userId :: ",
                socket.userId
            );

            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
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
            })

        } else if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                `--- matchMaking :: InvalidInput ::`,
                error,
                "userId :: ",
                socket.userId
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
            });

        }
        else if (error instanceof Errors.UnknownError) {
            logger.error("--- matchMaking :: UnknownError :: ERROR ::", error);
            throw new Errors.UnknownError(error);
        } else {
            logger.error(
                "--- matchMaking :: commonError :: ERROR ::",
                error,
                "userId :: ",
                socket.userId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: MESSAGES.ERROR.MATCH_MAKINGS_ERROR_MESSAGES,
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



export = matchMaking;