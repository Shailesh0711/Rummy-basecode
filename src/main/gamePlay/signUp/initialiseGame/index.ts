import config from "../../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { initializeGameplayIf, lockInPeriodTimerQueueIf } from "../../../interfaces/schedulerIf";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { setRejoinTableHistory } from "../../cache/TableHistory";
import { getTableData, setTableData } from "../../cache/Tables";
import bootCollect from "./bootValue";
import Scheduler from "../../../scheduler";
import Errors from "../../../errors"
import { throwErrorIF } from "../../../interfaces/throwError";

async function initializeGameplayForFirstRound(
    data: lockInPeriodTimerQueueIf
): Promise<void> {
    logger.info("------------>> initializeGameplayForFirstRound <<-------------")
    const { tableId } = data
    const { BOOT_COLLECTION_TIMER } = config()
    try {
        const tableData = await getTableData(tableId);
        const roundTableData = await getRoundTableData(tableId, tableData.currentRound);

        if (tableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.INIT_FIRST_ROUND_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> initializeGameplayForFirstRound :: tableData ::", tableData);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.INIT_FIRST_ROUND_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> initializeGameplayForFirstRound :: roundTableData ::", roundTableData);

        const { lobbyId, gameId, bootAmount: bootAmount } = tableData;

        const currentPlayersInTable = Object.keys(roundTableData.seats).filter(
            (ele) => roundTableData.seats[ele].userId,
        ).length;

        logger.info(
            '----->> initializeGameplayForFirstRound : total Player in table --- ',
            currentPlayersInTable,
        );
        // roundTableData.tableState = TABLE_STATE.COLLECTING_BOOT_VALUE;
        await setRoundTableData(tableId, tableData.currentRound, roundTableData);
        if (tableData.minPlayerForPlay <= roundTableData.totalPlayers) {

            if (!tableData.isFTUE) {
                Object.keys(roundTableData.seats).filter(
                    async (ele: string) => {
                        if (Object.keys(roundTableData.seats[ele]).length > 0) {
                            return await setRejoinTableHistory(
                                roundTableData.seats[ele].userId,
                                gameId,
                                lobbyId,
                                {
                                    userId: roundTableData.seats[ele].userId,
                                    tableId,
                                    lobbyId: tableData.lobbyId,
                                    isEndGame: false,
                                },
                            )
                        }
                    }
                );
            }

            const startTimer = await bootCollect(tableId, tableData.currentRound);
            logger.info("------->> initializeGameplayForFirstRound :: startTimer :: ", startTimer);
            if (startTimer.isCountiusGame) {
                await Scheduler.addJob.BootAmountCollect({
                    timer: BOOT_COLLECTION_TIMER * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound: tableData.currentRound
                })
            } else if (startTimer.isSendArrangeSeats) {
                await Scheduler.addJob.ArrageSeatingQueue({
                    timer: NUMERICAL.ONE * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound: tableData.currentRound
                })
            }
            tableData.startGameTime = new Date();
            await setTableData(tableData);
            
        } else {
            logger.warn(
                "----->> initializeGameplayForFirstRound : initializeGame table can't start : wait for user",
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.MINIMUM_PLAYERS_VALIDATION_MESSAGE,
                }
            })
        }
    } catch (error: any) {
        console.log("---initializeGameplayForFirstRound :: ERROR ::", error)
        let nonProdMsg = '';
        logger.error("---initializeGameplayForFirstRound :: ERROR ::", error);
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- initializeGameplayForFirstRound :: CancelBattle :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.INIT_FIRST_ROUND_ERROR) {
            logger.error(
                `--- initializeGameplayForFirstRound :: ERROR_TYPE :: ${ERROR_TYPE.INIT_FIRST_ROUND_ERROR}::`,
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
        } else if (error instanceof Errors.createCardGameTableError) {
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.CREATE_BATTLE_INSUFFICIENT_FUND_ERROR,
                    message: MESSAGES.GRPC_ERRORS.MSG_GRPC_DEBIT_ERROR,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        } else {
            logger.error(
                `--- initializeGameplayForFirstRound :: ERROR_TYPE :: ${ERROR_TYPE.INIT_FIRST_ROUND_ERROR}::`,
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: MESSAGES.ERROR.INITIALIZE_GAME_PLAY_ERROR_MESSAGES,
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


export = initializeGameplayForFirstRound