import config from "../../../../connections/config";
import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { initializeGameplayIf, lockInPeriodTimerQueueIf } from "../../../interfaces/schedulerIf";
import Scheduler from "../../../scheduler"
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getTableData, setTableData } from "../../cache/Tables";
import Errors from "../../../errors"
import { throwErrorIF } from "../../../interfaces/throwError";
import { removeQueue, setQueue } from "../../utils/manageQueue";
import { userSeatsIf } from "../../../interfaces/roundTableIf";
import { getUser, setUser } from "../../cache/User";
import { cardsDirtibution } from "../cards/helper/cardsDirtibution";

async function lockInPeriodStart(
    data: initializeGameplayIf
): Promise<void> {
    logger.debug("================>> lockInPeriodStart <<==================")
    const { tableId, queueKey } = data
    const { LOCK_IN_PERIOD_TIMER } = config()
    try {
        logger.info("----->> lockInPeriodStart :: data :: ", data)

        const tableData = await getTableData(tableId);
        logger.info("----->> lockInPeriodStart :: tableData :: ", tableData)
        if (tableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LOCK_IN_PERIOD_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        let roundTableData = await getRoundTableData(tableId, tableData.currentRound);
        logger.info("----->> lockInPeriodStart :: roundTableData :: ", roundTableData);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LOCK_IN_PERIOD_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        if (tableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {
            await removeQueue(queueKey, tableId);
        }

        if (tableData.minPlayerForPlay <= roundTableData.totalPlayers) {
            logger.info("----->> lockInPeriodStart :: start lock in period :: ")

            const seats: userSeatsIf = {} as userSeatsIf;
            if (tableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {

                for await (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                        seats[seat] = roundTableData.seats[seat]
                    }
                }
                roundTableData.seats = seats;
            }

            let playingplayerCount = NUMERICAL.ZERO;
            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    if (roundTableData.seats[seat].userStatus === PLAYER_STATE.PLAYING) {
                        playingplayerCount += NUMERICAL.ONE;
                    }
                }
            }

            // cards distribution for players
            if (tableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
                const rountTableInfo = await cardsDirtibution(tableId, tableData.currentRound);
                roundTableData = rountTableInfo;
            }

            roundTableData.tableState = TABLE_STATE.LOCK_IN_PERIOD;
            roundTableData.totalDealPlayer = roundTableData.totalPlayers;
            roundTableData.splitPlayers = roundTableData.totalPlayers;
            roundTableData.updatedAt = new Date();
            tableData.winPrice = (roundTableData.totalPlayers * tableData.bootAmount) * (1 - (tableData.rake / 100));

            // for check total player count currect
            logger.info("----->> lockInPeriodStart :: Object.keys(roundTableData.seats).length :: ", Object.keys(roundTableData.seats).length)

            roundTableData.totalPlayers = playingplayerCount;
            roundTableData.currentPlayer = playingplayerCount;

            await setTableData(tableData);
            await setRoundTableData(tableId, tableData.currentRound, roundTableData);

            commonEventEmitter.emit(EVENTS.LOCK_IN_PERIOD_POPUP_SCOKET_EVENT, {
                tableId: tableData._id,
                data: {
                    msg: MESSAGES.MESSAGE.LOCK_IN_PERIOD,
                },
            });

            const lockInPeriodTimer = Number(LOCK_IN_PERIOD_TIMER) + 0.5;
            logger.info("----->> lockInPeriodStart :: LOCK_IN_PERIOD_TIMER :: ", LOCK_IN_PERIOD_TIMER, "type of :: ", typeof LOCK_IN_PERIOD_TIMER)
            logger.info("----->> lockInPeriodStart :: lockInPeriodTimer :: ", lockInPeriodTimer);

            await Scheduler.addJob.LockInPeriodTimerQueue({
                timer: lockInPeriodTimer * NUMERICAL.THOUSAND,
                tableId,
                queueKey,
                currentRound: tableData.currentRound
            });
            
        } else {
            // show error poppup or wait for popup to user
            logger.warn(`----->> lockInPeriodStart :: Player requires a minimum of ${tableData.minPlayerForPlay}`)
            await setQueue(queueKey, tableData._id);
            roundTableData.tableState = TABLE_STATE.WAIT_FOR_PLAYER;

            await setRoundTableData(tableId, tableData.currentRound, roundTableData);

            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: tableData._id,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE,
                }
            });
        }
    } catch (error: any) {
        console.log("---lockInPeriodStart :: ERROR :: ", error);
        logger.error("---lockInPeriodStart :: ERROR :: ", error);

        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- lockInPeriodStart :: CancelBattle :: ERROR ::",
                error,
                " tableId:: ",
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

        } else if (error && error.type === ERROR_TYPE.LOCK_IN_PERIOD_ERROR) {
            logger.error(
                `--- lockInPeriodStart :: ERROR_TYPE :: ${ERROR_TYPE.LOCK_IN_PERIOD_ERROR}::`,
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
                "--- lockInPeriodStart :: commonError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: MESSAGES.ERROR.LOCK_IN_PERIOD_ERROR_MESSAGES,
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

export = lockInPeriodStart;