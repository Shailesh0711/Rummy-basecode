import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import { playingTableIf } from "../../../interfaces/playingTableIf";
import { leaveTableEventRequestIf } from "../../../interfaces/requestIf";
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getPlayerGamePlay, removePlayerGameData, setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, removeRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { removeRejoinTableHistory } from "../../cache/TableHistory";
import { getTableData, removeTableData } from "../../cache/Tables";
import { formatLeaveTableInfo } from "../../formatResponse";
import leaveTableHelper from "./helper"
import config = require("../../../../connections/config");
import { leaveRoundTable } from "./leaveRoundTable";
import Errors from "../../../errors";
import { getLock } from "../../../lock";
import { getUser, setUser } from "../../cache/User";
import { setOldTableIdsHistory } from "../../utils/setOldTableIdsHistory";

async function leaveTable(
    tableId: string,
    socket: any
): Promise<void> {
    logger.info("------------------>> leaveTable <<------------------------")
    const { userId } = socket.eventMetaData;
    logger.info(`---->> leaveTable :: userId : ${userId}`);
    const { LOCK_IN_PERIOD } = config()
    const leaveTableLocks = await getLock().acquire([`locks:${tableId}`], 2000);
    try {

        let flag: boolean = false;
        let playerLeave: boolean = false;

        const playingTable: playingTableIf = await getTableData(tableId);
        logger.info(`----->> leaveTable :: playingTable ::`, playingTable)

        if (playingTable === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const { currentRound, gameId, lobbyId, gameType } = playingTable;

        const roundTableData: roundTableIf = await getRoundTableData(
            tableId,
            currentRound,
        );
        logger.info(`----->> leaveTable :: roundTableData ::`, roundTableData)

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        logger.info(
            `----->> leaveTable :: roundPlayingTable.tableState : ${roundTableData.tableState}`,
        );

        if (typeof userId === 'undefined' || userId === '' || userId === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.USER_ID_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const playerData: playerPlayingDataIf = await getPlayerGamePlay(
            userId,
            tableId,
        );
        logger.info(`----->> leaveTable :: playerData ::`, playerData);

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.LEAVE_TABLE_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const userData = await getUser(userId);
        logger.info(`----->> leaveTable :: userData :: before ::`, userData);
        userData.OldLobbyId = "";
        // setOldtableID in userData
        const userInfo = await setOldTableIdsHistory(userData, tableId);
        userData.oldTableId = userInfo.oldTableId;

        userData.tableId = tableId;
        await setUser(userId, userData);

        logger.info(`----->> leaveTable :: userData :: after ::`, userData);
        logger.info(`----->> leaveTable :: userState ::`, roundTableData.seats[`s${playerData.seatIndex}`].userStatus);

        if (
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LEFT &&
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LOST
        ) {
            let totalPlayersCount: number = NUMERICAL.ZERO;
            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    totalPlayersCount += NUMERICAL.ONE;
                }
            }
            if (
                (roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER && totalPlayersCount === NUMERICAL.ONE) ||
                (roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS && totalPlayersCount === NUMERICAL.ONE)
            ) {
                playerLeave = false;
                flag = false;

                logger.info(`----->> leaveTable :: WAIT_FOR_PLAYER :: playerLeave :: ${playerLeave} And flag ::${flag}`)
                logger.info(`----->> leaveTable :: TABLE_STATE :: WAIT_FOR_PLAYER `)

                await leaveTableHelper.userLeaveOnWaitForPlayer(userId, playerData.seatIndex, playingTable, false);
            } else if (
                roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
                (roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER && totalPlayersCount > NUMERICAL.ONE)
            ) {
                playerLeave = false;
                flag = false;
                logger.info(`----->> leaveTable :: WAITING_FOR_PLAYERS :: playerLeave :: ${playerLeave} And flag ::${flag}`);
                logger.info(`----->> leaveTable :: TABLE_STATE :: WAITING_FOR_PLAYERS `)

                playerLeave = await leaveTableHelper.userLeaveOnWaitingPlayer(
                    userId,
                    roundTableData,
                    playingTable,
                );

            } else if (
                currentRound === NUMERICAL.ONE &&
                (roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ||
                    roundTableData.tableState === TABLE_STATE.LOCK_IN_PERIOD ||
                    roundTableData.tableState === TABLE_STATE.COLLECTING_BOOT_VALUE ||
                    roundTableData.tableState === TABLE_STATE.TOSS_CARDS
                )
            ) {
                flag = false;
                const leaveStatus = await leaveTableHelper.userLeaveOnLock(
                    playerData,
                    roundTableData,
                    playingTable,
                );
                if (leaveStatus) {

                    logger.info(`----->> leaveTable :: ${roundTableData.tableState} :: playerLeave :: ${playerLeave} And flag ::${flag}`)
                    logger.info(`----->> leaveTable :: TABLE_STATE :: ${roundTableData.tableState} `)

                    userData.OldLobbyId = userData.lobbyId;
                    await setUser(userData.userId, userData);

                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TITLE,
                            message: LOCK_IN_PERIOD
                                ? LOCK_IN_PERIOD
                                : MESSAGES.ALERT_MESSAGE.LOCK_IN_STATE,
                        },
                    });
                    // throw new Error('user try to leave in lock in state');
                } else {
                    playerLeave = false;
                    flag = false
                    if (roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED) {
                        playerLeave = false;
                    }
                    logger.info(`----->> leaveTable :: playerLeave :: ${playerLeave} And flag ::${flag}`)
                    logger.info(`----->> leaveTable :: TABLE_STATE :: ROUND_TIMER_STARTED `)
                }
            } else {
                playerLeave = true;
                flag = true
                logger.info(`----->> leaveTable ::  ${roundTableData.tableState} :: playerLeave :: ${playerLeave} And flag ::${flag}`);
                logger.info(`----->> leaveTable :: TABLE_STATE :: ${roundTableData.tableState} `)

            }
            logger.info(`----->> leaveTable :: before leaveRoundTable :: playerLeave :: ${playerLeave} And flag ::${flag}`);

            await getLock().release(leaveTableLocks);
            if (playerLeave || flag) {
                logger.info(`----------->> leaveTable ::  userId : ${userId} :: tableId :: ${tableId} :: currentRound :: ${currentRound}`);
                await leaveRoundTable(flag, playerLeave, userId, tableId, currentRound);
            }
        } else {

            let totalPlayersCount: number = NUMERICAL.ZERO;
            let leftPlayerCount: number = NUMERICAL.ZERO;

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    if (
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.LEFT ||
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.LOST
                    ) {

                        leftPlayerCount += NUMERICAL.ONE;
                    }
                    totalPlayersCount += NUMERICAL.ONE;
                }
            }

            if (totalPlayersCount === leftPlayerCount) {
                await removeTableData(tableId);

                for await (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                        await removePlayerGameData(roundTableData.seats[seat].userId, tableId);
                        await removeRejoinTableHistory(roundTableData.seats[seat].userId, playingTable.gameId, playingTable.lobbyId);
                    }
                }

                for (let i = NUMERICAL.ONE; i <= playingTable.currentRound; i++) {
                    await removeRoundTableData(tableId, i)
                }

            } else {

                await removePlayerGameData(userId, tableId);
                await removeRejoinTableHistory(userId, playingTable.gameId, playingTable.lobbyId);

            }

            const formatedRes = await formatLeaveTableInfo(
                tableId,
                userId,
                playerData.seatIndex,
                currentRound,
                roundTableData.tableState,
                roundTableData.totalPlayers,
                playerData.username,
                playingTable.winPrice,
                true,
                null
            )

            logger.info("------->> leaveTable :: formatLeaveTableInfo ::", formatedRes);
            commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
                tableId,
                socket: playerData.socketId,
                data: formatedRes
            });

        }

    } catch (error: any) {
        logger.error("---leaveTable :: ERROR: " + error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- leaveTable :: CancelBattle :: ERROR ::",
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
        } else if (error instanceof Errors.UnknownError) {
            nonProdMsg = 'GRPC_FAILED';
            logger.error(
                "--- leaveTable :: UnknownError :: ERROR ::",
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
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
        }
        else if (error && error.type === ERROR_TYPE.LEAVE_TABLE_ERROR) {
            logger.error(
                `--- leaveTable :: ERROR_TYPE :: ${ERROR_TYPE.LEAVE_TABLE_ERROR}::`,
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            nonProdMsg = "Database Error";
            logger.error(`--- leaveTable :: ERROR_TYPE :: ${ERROR_TYPE.LEAVE_TABLE_ERROR} :: message :: ${nonProdMsg}`);
        }
        else {
            logger.error(
                "--- leaveTable :: commonError :: ERROR ::",
                error,
                "userId :: ",
                userId,
                `tableId :: ${tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.LEAVE_TABLE_ERROR,
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

export = leaveTable;