import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, SPLIT_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import Scheduler from "../../../scheduler";
import commonEventEmitter from "../../../commonEventEmitter";
import amountSplitDetails from "./amountSplitDetails";
import formatPlayerSplitAmountDetails from "../../formatResponse/formatPlayerSplitAmountDetails";
import { throwErrorIF } from "../../../interfaces/throwError";
import Errors from "../../../errors"
import config from "../../../../connections/config";
import { playersSplitAmountDetailsIf } from "../../../interfaces/splitAmount";
import timeDifference from "../../../common/timeDiff";
import { getPlayerGamePlay } from "../../cache/Players";

async function splitAmount(
    tableId: string,
    currentRound: number,
    isSplit: boolean,
    isAutoSplit: boolean,
    userId?: string
): Promise<void> {
    logger.info("---------------------->> SplitAmount <<------------------------------");
    const { AUTO_SPLIT_AMOUNT_TIMER, SPLIT_AMOUNT_TIMER } = config()
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.SPLIT_AMOUNT_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> splitAmount :: roundTableData :: ", roundTableData)
        // check table state is show scoreboard
        if (
            roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD &&
            roundTableData.isEligibleForSplit
        ) {
            if (!roundTableData.isSplit) {

                roundTableData.isSplit = true;

                // send how much split amount for all player
                const playersSplitDetails: playersSplitAmountDetailsIf[] = await amountSplitDetails(tableId, currentRound, isAutoSplit);
                logger.info("----->> splitAmount :: amountSplitDetails :: ", playersSplitDetails);

                // send event for all users (en split Amount)

                // message for responce
                let message = ``;
                let timer : number = NUMERICAL.ZERO;

                isAutoSplit ? (message = MESSAGES.MESSAGE.AUTO_SPLIT_MESSAGE) : (message = MESSAGES.MESSAGE.MANUAL_SPLIT_CONFIRM_MESSAGE);
                isAutoSplit ? (timer = AUTO_SPLIT_AMOUNT_TIMER) : (timer = timeDifference(new Date(), roundTableData.updatedAt, SPLIT_AMOUNT_TIMER) - NUMERICAL.ONE);

                let formatedRes = await formatPlayerSplitAmountDetails(tableId, message, timer, playersSplitDetails);
                logger.info("----->> splitAmount :: formatPlayerSplitAmountDetails :: ", formatedRes);
                if (!isAutoSplit) {
                    logger.info("---->> splitAmount :: Manual Split Started ")
                    await setRoundTableData(tableId, currentRound, roundTableData);
                    if (isSplit) {
                        // send all players this event
                        for await (const playerInfo of playersSplitDetails) {
                            if (
                                playerInfo.splitStatus === SPLIT_STATE.NO ||
                                playerInfo.splitStatus === SPLIT_STATE.YES
                            ) {
                                commonEventEmitter.emit(EVENTS.SPLIT_AMOUNT, {
                                    socket: playerInfo.socketId,
                                    data: formatedRes
                                });
                            }
                        }
                    }
                    if (!isSplit) {
                        // manual split
                        await setRoundTableData(tableId, currentRound, roundTableData);
                        for await (const playerInfo of playersSplitDetails) {
                            commonEventEmitter.emit(EVENTS.MANUAL_SPLIT_AMOUNT, {
                                socket: playerInfo.socketId,
                                data: formatedRes
                            });
                        }
                    }
                } else {
                    // auto split for
                    logger.info("---->> splitAmount :: Auto Split Started ");
                    roundTableData.tableState = TABLE_STATE.AUTO_SPLIT_AMOUNT_START;
                    roundTableData.updatedAt = new Date();
                    await setRoundTableData(tableId, currentRound, roundTableData);

                    for await (const playerInfo of playersSplitDetails) {
                        formatedRes.title = `${MESSAGES.MESSAGE.AUTO_SPLIT_TITLE}${playerInfo.amount}`
                        commonEventEmitter.emit(EVENTS.SPLIT_AMOUNT, {
                            socket: playerInfo.socketId,
                            data: formatedRes
                        });
                    }

                    await Scheduler.addJob.AutoSplitTimerQueue({
                        timer: timer * NUMERICAL.THOUSAND,
                        tableId,
                        currentRound,
                    });
                }

            } else {
                // if player manual split close and re-opne
                let message = MESSAGES.MESSAGE.MANUAL_SPLIT_CONFIRM_MESSAGE;
                let timer = timeDifference(new Date(), roundTableData.updatedAt, SPLIT_AMOUNT_TIMER) - NUMERICAL.TWO;

                const playerData = await getPlayerGamePlay(userId as string, tableId);
                const playersSplitDetails: playersSplitAmountDetailsIf[] = await amountSplitDetails(tableId, currentRound, isAutoSplit);
                logger.info("----->> splitAmount :: amountSplitDetails :: ", playersSplitDetails);

                const formatedRes = await formatPlayerSplitAmountDetails(tableId, message, timer, playersSplitDetails);
                logger.info("----->> splitAmount :: formatPlayerSplitAmountDetails :: ", formatedRes);

                if (playerData.playingStatus === PLAYER_STATE.SPLIT_AMOUNT) {
                    if (playerData.splitDetails.splitStatus === SPLIT_STATE.PENDING) {
                        commonEventEmitter.emit(EVENTS.MANUAL_SPLIT_AMOUNT, {
                            socket: playerData.socketId,
                            data: formatedRes
                        });
                    } else {
                        commonEventEmitter.emit(EVENTS.SPLIT_AMOUNT, {
                            socket: playerData.socketId,
                            data: formatedRes
                        });
                    }
                }
            }

        } else {
            // send ack popup notification
            logger.warn("----->> splitAmount :: Table State is not DISPLAY_SCOREBOARD")
            // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
            //     tableId,
            //     data: {
            //         isPopup: true,
            //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
            //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            //         message: MESSAGES.POPUP.MIDDLE_TOAST_POP.SPLIT_AMOUNT_POPUP_MESSAGE,
            //     }
            // });
        }
    } catch (error: any) {
        console.log("--- splitAmount :: ERROR :: ", error)
        logger.error("--- splitAmount :: ERROR :: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- splitAmount :: CancelBattle :: ERROR ::",
                error,
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
        } else if (error && error.type === ERROR_TYPE.SPLIT_AMOUNT_ERROR) {
            logger.error(
                `--- splitAmount :: ERROR_TYPE :: ${ERROR_TYPE.SPLIT_AMOUNT_ERROR}::`,
                error,
                `tableId : ${tableId}`
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
                "--- splitAmount :: commonError :: ERROR ::",
                error,
                `tableId : ${tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.SPLIT_AMOUNT_ERROR,
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

export = splitAmount;