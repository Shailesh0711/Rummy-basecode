import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, RUMMY_TYPES } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { setDealerInfoIf } from "../../../interfaces/responseIf";
import { tossCardTimerQueueIf } from "../../../interfaces/schedulerIf";
import { getRoundTableData } from "../../cache/Rounds";
import { getTableData } from "../../cache/Tables";
import { formatSetDealerInfo } from "../../formatResponse";
import { distributeCards } from "../cards";
import Errors from "../../../errors";
import Scheduler from "../../../scheduler";
import config from "../../../../connections/config";
import { throwErrorIF } from "../../../interfaces/throwError";

async function startRound(
    data: tossCardTimerQueueIf
): Promise<void> {
    logger.debug("=====================>> startRound <<============================")
    const { tableId, currentRound } = data;
    const { DISTRIBUTE_CARDS } = config()
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.START_ROUND_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> startRound :: roundTableData :: ", roundTableData);

        const dealerUserData: any = Object.keys(roundTableData.seats).find((ele) => roundTableData.seats[ele].userId === roundTableData.dealerPlayer)
        logger.info("----->> startRound :: dealerUserData :: ", dealerUserData);

        const dealer = roundTableData.seats[dealerUserData];
        logger.info("----->> startRound :: dealer :: ", dealer);

        const setDealerData = {
            tableId,
            userId: dealer.userId,
            username: dealer.username,
            seatIndex: dealer.seatIndex,
            currentRound
        }

        const formatedSetDealerData: setDealerInfoIf = await formatSetDealerInfo(setDealerData)
        logger.info("----->> startRound :: formatSetDealerInfo :: ", formatedSetDealerData);

        commonEventEmitter.emit(EVENTS.SET_DEALER_SOCKET_EVENT, {
            tableId,
            data: formatedSetDealerData
        });

        const lockKeys: string[] = [];

        if (roundTableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    lockKeys.push(`locks:${roundTableData.seats[seat].userId}`)
                }
            }
        }

        await distributeCards(tableId, currentRound, lockKeys);

        await Scheduler.addJob.DistributeCardsQueue({
            tableId,
            timer: DISTRIBUTE_CARDS * NUMERICAL.THOUSAND,
            currentRound
        });

    } catch (error: any) {
        logger.error("----startRound :: ERROR ::", error);
        let nonProdMsg = '';

        if (error instanceof Errors.DistributeCardsError) {
            logger.error(
                "--- startRound :: DistributeCardsError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.DISTRITUTE_CARD_ERROR,
                    message: MESSAGES.ERROR.DISTRITUTE_CARD_ERROR,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- startRound :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                tableId
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
        } else if (error && error.type === ERROR_TYPE.START_ROUND_ERROR) {
            logger.error(
                `--- startRound :: ERROR_TYPE :: ${ERROR_TYPE.START_ROUND_ERROR}::`,
                error,
                "tableId :: ",
                tableId
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
                "--- startRound :: commonError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: MESSAGES.ERROR.START_ROUND_ERROR_MESSAGES,
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

export = startRound