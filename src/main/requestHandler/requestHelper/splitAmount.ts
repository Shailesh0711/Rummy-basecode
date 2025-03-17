import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, SPLIT_STATE, TABLE_STATE } from "../../../constants";
import { PREFIX } from "../../../constants/redis";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay, removePlayerGameData, setPlayerGamePlay } from "../../gamePlay/cache/Players";
import { removeRoundTableHistory } from "../../gamePlay/cache/RoundHistory";
import { getRoundTableData, removeRoundTableData, setRoundTableData } from "../../gamePlay/cache/Rounds";
import { removeScoreBoardHistory } from "../../gamePlay/cache/ScoreBoardHistory";
import { removeRejoinTableHistory } from "../../gamePlay/cache/TableHistory";
import { getTableData, popTableFromQueue, removeTableData } from "../../gamePlay/cache/Tables";
import { removeTurnHistoy } from "../../gamePlay/cache/TurnHistory";
import { getUser, setUser } from "../../gamePlay/cache/User";
import formatPlayerSplitAmountDetails from "../../gamePlay/formatResponse/formatPlayerSplitAmountDetails";
import { splitAmountEventHelperReq } from "../../interfaces/requestIf";
import { playersSplitAmountDetailsIf, splitAmountDeclareIf } from "../../interfaces/splitAmount";
import { requestValidator } from "../../validator";
import Scheduler from "../../scheduler";
import config from "../../../connections/config";
import Errors from "../../errors";
import { throwErrorIF } from "../../interfaces/throwError";
import { getLock } from "../../lock";
import { playerPlayingDataIf } from "../../interfaces/playerPlayingTableIf";
import timeDifference from "../../common/timeDiff";


async function splitAmountHandler(
    { data }: splitAmountEventHelperReq,
    socket: any,
    ack?: Function
): Promise<void> {
    logger.info("====================>> splitAmountHandler <<=======================");
    const { SPLIT_AMOUNT_TIMER, DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER } = config()
    const splitAmountLocks = await getLock().acquire([`locks:${data.tableId}`], 5000);
    try {
        data = await requestValidator.splitAmountValidator(data);
        logger.info("------->> splitAmountHandler :: data ::", data);

        const userId = socket.eventMetaData.userId || data.userId;
        const tableId = socket.eventMetaData.tableId || data.userId;
        const currentRound = socket.eventMetaData.currentRound || data.userId;

        logger.info("------->> splitAmountHandler :: userId ::", userId);
        logger.info("------->> splitAmountHandler :: tableId ::", tableId);
        logger.info("------->> splitAmountHandler :: currentRound ::", currentRound);

        const tableData = await getTableData(tableId);
        logger.info("------->> splitAmountHandler :: tableData ::", tableData);

        if (tableData.currentRound !== currentRound) {
            return;
        }

        const roundTableData = await getRoundTableData(tableId, currentRound);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.SPLIT_AMOUNT_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> splitAmountHandler :: roundTableData :: ", roundTableData)

        const playerData: playerPlayingDataIf = await getPlayerGamePlay(
            userId,
            tableId,
        );

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`----->> splitAmountHandler :: playerData ::`, playerData);

        if (
            playerData.playingStatus === PLAYER_STATE.SPLIT_AMOUNT &&
            roundTableData.isSplit &&
            roundTableData.isEligibleForSplit
        ) {
            // const userIds = await getPlayersIds(roundTableData.seats);
            let userIds: string[] = [];
            let playersSplitDetails: playersSplitAmountDetailsIf[] = [];
            const playersSplitState: string[] = []

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                    const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);

                    if (playerData.playingStatus === PLAYER_STATE.SPLIT_AMOUNT) {
                        userIds.push(playerData.userId)
                        if (playerData.userId === userId) {
                            if (data.isSplitAmount) {
                                playerData.splitDetails.splitStatus = SPLIT_STATE.YES
                            } else {
                                playerData.splitDetails.splitStatus = SPLIT_STATE.NO
                            }
                            await setPlayerGamePlay(userId, tableId, playerData)
                            const obj = {
                                userId: playerData.userId,
                                amount: playerData.splitDetails.amount,
                                splitStatus: playerData.splitDetails.splitStatus,
                                remainDrops: playerData.splitDetails.drop,
                                socketId: playerData.socketId,
                                userName: playerData.username,
                                gameScore: playerData.gamePoints
                            }
                            playersSplitState.push(playerData.splitDetails.splitStatus)
                            playersSplitDetails.push(obj);
                        } else {
                            const obj = {
                                userId: playerData.userId,
                                amount: playerData.splitDetails.amount,
                                splitStatus: playerData.splitDetails.splitStatus,
                                remainDrops: playerData.splitDetails.drop,
                                socketId: playerData.socketId,
                                userName: playerData.username,
                                gameScore: playerData.gamePoints
                            }
                            playersSplitState.push(playerData.splitDetails.splitStatus)
                            playersSplitDetails.push(obj);
                        }
                    }
                }
            }
            const allEqual = playersSplitState.every((val) => val === SPLIT_STATE.YES);
            const splitPendingData = []
            for await (const playerInfo of playersSplitDetails) {
                if (playerInfo.splitStatus === SPLIT_STATE.PENDING) {
                    splitPendingData.push(SPLIT_STATE.PENDING)
                }
            }

            let message = splitPendingData.length === NUMERICAL.ZERO ?
                MESSAGES.MESSAGE.MANUAL_SPLIT_NOT_AGREE_MESSAGE : MESSAGES.MESSAGE.MANUAL_SPLIT_SINGLE_PLAYER_ACCEPED;
            let timer = timeDifference(new Date(), roundTableData.updatedAt, SPLIT_AMOUNT_TIMER) - NUMERICAL.ONE;
            timer = allEqual ? DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER : splitPendingData.length === NUMERICAL.ZERO ? DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER : timer;


            let formatedRes = await formatPlayerSplitAmountDetails(tableId, message, timer, playersSplitDetails)
            logger.info("----->> splitAmountHandler :: formatPlayerSplitAmountDetails :: ", formatedRes);

            for (const playerInfo of playersSplitDetails) {
                if (
                    playerInfo.splitStatus === SPLIT_STATE.NO ||
                    playerInfo.splitStatus === SPLIT_STATE.YES
                ) {
                    if (playerInfo.splitStatus === SPLIT_STATE.YES) {
                        formatedRes.message = MESSAGES.MESSAGE.MANUAL_SPLIT_SINGLE_PLAYER_ACCEPED;
                    }
                    if (playerInfo.splitStatus === SPLIT_STATE.NO) {
                        formatedRes.message = MESSAGES.MESSAGE.MANUAL_SPLIT_REJECT_MESSAGE;
                    }
                    if (playerInfo.splitStatus === SPLIT_STATE.YES && splitPendingData.length === NUMERICAL.ZERO) {
                        formatedRes.message = MESSAGES.MESSAGE.MANUAL_SPLIT_NOT_AGREE_MESSAGE;
                    }
                    if (allEqual) {
                        formatedRes.message = `${MESSAGES.MESSAGE.SPLIT_WIN_MESSAGE}${playerInfo.amount}!`
                    }
                    logger.info("----->> splitAmountHandler :: ", EVENTS.SPLIT_AMOUNT, " :: ", playerInfo.splitStatus, "userID :: ", playerInfo.userId)
                    formatedRes.title = `${MESSAGES.MESSAGE.SPLIT_EVENT_MESSAGE}${playerInfo.amount}`;
                    commonEventEmitter.emit(EVENTS.SPLIT_AMOUNT, {
                        socket: playerInfo.socketId,
                        data: formatedRes
                    });
                } else {
                    logger.info("----->> splitAmountHandler :: ", EVENTS.SPLIT_AMOUNT, " :: ", playerInfo.splitStatus, "userID :: ", playerInfo.userId)
                    formatedRes.message = MESSAGES.MESSAGE.MANUAL_SPLIT_CONFIRM_MESSAGE;
                    commonEventEmitter.emit(EVENTS.MANUAL_SPLIT_AMOUNT, {
                        socket: playerInfo.socketId,
                        data: formatedRes
                    });
                }
            }


            if (allEqual) {
                // game over (split declared);
                // cancel timer split amount timer
                await Scheduler.cancelJob.splitAmountTimerCancel(tableId);

                // cancel timer of scoreboard
                await Scheduler.cancelJob.ScoreBoardTimerCancel(tableId);

                roundTableData.updatedAt = new Date();

                await setRoundTableData(tableId, currentRound, roundTableData)

                const playerDetails: splitAmountDeclareIf[] = [];

                for await (const userID of userIds) {
                    const userData = await getUser(userID);
                    const playerData = await getPlayerGamePlay(userID, tableId);
                    const obj = {
                        userId: userID,
                        winAmount: playerData.splitDetails.amount,
                        balance: userData.balance + playerData.splitDetails.amount
                    }
                    playerDetails.push(obj);
                }

                await Scheduler.addJob.AutoSplitTimerQueue({
                    timer: DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER * NUMERICAL.THOUSAND,
                    tableId: data.tableId,
                    currentRound: data.currentRound
                });
            } else {

                const splitDeclareInfo = []
                for await (const playerInfo of playersSplitDetails) {
                    if (playerInfo.splitStatus === SPLIT_STATE.PENDING) {
                        splitDeclareInfo.push(SPLIT_STATE.PENDING)
                    }
                }

                if (splitDeclareInfo.length === NUMERICAL.ZERO) {
                    // cancel split timer
                    await Scheduler.cancelJob.splitAmountTimerCancel(tableId);
                    await Scheduler.cancelJob.ScoreBoardTimerCancel(tableId);

                    roundTableData.updatedAt = new Date();
                    await setRoundTableData(tableId, currentRound, roundTableData);

                    await Scheduler.addJob.ScoreBoardTimerQueue({
                        timer: timer * NUMERICAL.THOUSAND,
                        tableId,
                        currentRound,
                        isAutoSplit: false
                    });
                }

            }

        } else {
            // ack popup
            logger.warn('------->> splitAmountHandler :: Split amount exceeded....')
        }

    } catch (error: any) {
        logger.error("---- splitAmountHandler :: ERROR :: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- splitAmountHandler :: InvalidInput :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
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
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- splitAmountHandler :: CancelBattle :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId :: ${data.tableId}`
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
        } else if (error && error.type === ERROR_TYPE.SPLIT_AMOUNT_ERROR) {
            logger.error(
                `--- splitAmountHandler :: ERROR_TYPE :: ${ERROR_TYPE.SPLIT_AMOUNT_ERROR}::`,
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
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
                "--- splitAmountHandler :: commonError :: ERROR ::",
                error,
                "userId :: ",
                data.userId,
                `tableId : ${data.tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
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
    } finally {
        await getLock().release(splitAmountLocks);
        logger.info("-=-=-=-=>> splitAmountHandler :: lock relese ::")
    }
}

export = splitAmountHandler;