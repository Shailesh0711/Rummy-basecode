import {
    ERROR_TYPE,
    EVENTS,
    MESSAGES,
    NUMERICAL,
    PLAYER_STATE,
    RUMMY_TYPES,
    TABLE_STATE,
} from "../../../../constants";
import logger from "../../../../logger";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData } from "../../cache/Rounds";
import { getTableData } from "../../cache/Tables";
import leaveTable from "../../play/leaveTable";
import leaveTableHelper from "../../play/leaveTable/helper";
import { leaveRoundTable } from "../../play/leaveTable/leaveRoundTable";
import Scheduler from "../../../scheduler";
import config from "../../../../connections/config";
import commonEventEmitter from "../../../commonEventEmitter";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getUser, setUser } from "../../cache/User";
import { getLock } from "../../../lock";
import { setRejoinTableHistory } from "../../cache/TableHistory";
import { setOldTableIdsHistory } from "../../utils/setOldTableIdsHistory";

async function userDisconnect(socket: any, disc?: any) {
    logger.info(`==================>> userDisconnect <<=====================`);
    logger.warn(
        `------->> userDisconnect :: Reason :: ${disc} :: socket id :: ${socket.id}`
    );
    logger.info(`socket.eventMetaData ::: `, socket.eventMetaData);

    const { LEAVE_TABLE_TIMER, DISCONNECTED_PLAYER_POPUP_MESSAGE } = config();

    let disconnectLocks = socket && socket.eventMetaData && socket.eventMetaData.tableId && socket.eventMetaData.userId ? await getLock().acquire([`locks:${socket.eventMetaData.userId}`, `locks:${socket.eventMetaData.tableId}`], 2000) : null;
    try {
        let playerLeave = false;
        let flag = false;

        if (
            typeof socket.eventMetaData === "undefined" ||
            socket.eventMetaData === undefined
        ) {
            throw new Error("disconnect eventMetaData is not found");
        } else {
            const { tableId, userId } = socket.eventMetaData;
            logger.info(`socket.eventMetaData ::: userId ::`, userId);
            logger.info(`socket.eventMetaData ::: tableId ::`, tableId);

            if (
                typeof userId != "undefined" &&
                userId != "" &&
                typeof tableId != "undefined" &&
                tableId != ""
            ) {
                logger.info(
                    "userDisconnect : socket.eventMetaData ::: ",
                    socket.eventMetaData,
                    "userDisconnect : userId ::: ",
                    userId,
                    "userDisconnect : tableId ::: ",
                    tableId
                );
                logger.info(`socket.eventMetaData ::: userId ::`, userId);
                logger.info(`socket.eventMetaData ::: tableId ::`, tableId);
                logger.info(`socket.eventMetaData ::: typeof userId ::`, typeof userId);
                logger.info(`socket.eventMetaData ::: typeof tableId ::`, typeof tableId);
                const playingTable = await getTableData(tableId);
                const userPlayingTable = await getPlayerGamePlay(userId, tableId);
                const userData = await getUser(userId);
                logger.info(`socket.eventMetaData ::: userData ::`, userData);
                logger.info(`socket.eventMetaData ::: playingTable ::`, playingTable);
                logger.info(`socket.eventMetaData ::: userPlayingTable ::`, userPlayingTable);

                logger.info(`---->> userDisconnect :: userData SocketId :: ${userData.socketId} :: socket.id :: ${socket.id}`)

                if (playingTable === null) {
                    const errorObj: throwErrorIF = {
                        type: ERROR_TYPE.USER_DICONNECTION_ERROR,
                        message: MESSAGES.ERROR.DISCONNECT_TABLE_NOT_FOUND_ERROR_MESSAGES,
                        isCommonToastPopup: true,
                    };
                    throw errorObj;
                }
                logger.info(`----->> userDisconnect :: tableData ::`, playingTable);

                if (userPlayingTable === null) {
                    const errorObj: throwErrorIF = {
                        type: ERROR_TYPE.USER_DICONNECTION_ERROR,
                        message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                        isCommonToastPopup: true,
                    };
                    throw errorObj;
                }
                logger.info(
                    `----->> userDisconnect :: playerData ::`,
                    userPlayingTable
                );
                
                if (userPlayingTable.socketId === socket.id) {

                    if (playingTable != null) {
                        logger.info(`----->> userDisconnect :: playingTable is not null ::`);
                        const { currentRound, lobbyId, gameId, isFTUE } = playingTable;

                        const roundTableData = await getRoundTableData(tableId, currentRound);


                        logger.info(`----->> userDisconnect :: userData ::`, userData);
                        logger.info(
                            `----->> userDisconnect :: roundPlayingTable :: `,
                            roundTableData
                        );
                        if (userPlayingTable.playingStatus !== PLAYER_STATE.LEFT) {
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
                                logger.info(
                                    `----->> userDisconnect :: playerLeave :: true And flag ::${flag}`
                                );
                                logger.info(
                                    `----->> userDisconnect :: TABLE_STATE :: WAIT_FOR_PLAYER `
                                );

                                await leaveTableHelper.userLeaveOnWaitForPlayer(
                                    userId,
                                    userPlayingTable.seatIndex,
                                    playingTable,
                                    true
                                );
                            }
                            else if (
                                roundTableData.tableState === TABLE_STATE.LOCK_IN_PERIOD ||
                                roundTableData.tableState === TABLE_STATE.COLLECTING_BOOT_VALUE ||
                                roundTableData.tableState === TABLE_STATE.TOSS_CARDS
                            ) {
                                const leaveStatus = await leaveTableHelper.userLeaveOnLock(
                                    userPlayingTable,
                                    roundTableData,
                                    playingTable
                                );

                                if (leaveStatus) {
                                    // timer start
                                    playerLeave = false;
                                    flag = false;
                                    logger.info(
                                        `----->> userDisconnect :: playerLeave :: ${playerLeave} And flag ::${flag}`
                                    );
                                    logger.info(
                                        `----->> userDisconnect :: TABLE_STATE :: ${roundTableData.tableState} `
                                    );

                                    // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                    //     tableId,
                                    //     data: {
                                    //         isPopup: true,
                                    //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_TOAST_POPUP,
                                    //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                    //         message: DISCONNECTED_PLAYER_POPUP_MESSAGE,
                                    //         userId: userPlayingTable.userId,
                                    //         seatIndex: userPlayingTable.seatIndex,
                                    //     },
                                    // });
                                    userData.OldLobbyId = playingTable.lobbyId;

                                    const userInfo = await setOldTableIdsHistory(userData, tableId);
                                    userData.oldTableId = userInfo.oldTableId;

                                    userData.tableId = tableId;
                                    if (
                                        playingTable.rummyType === RUMMY_TYPES.DEALS_RUMMY ||
                                        playingTable.rummyType === RUMMY_TYPES.POINT_RUMMY
                                    ) {
                                        userPlayingTable.isDisconneted = true;
                                        await setPlayerGamePlay(userId, tableId, userPlayingTable)
                                    }
                                    await setUser(userData.userId, userData);

                                    // set rejoin history
                                    await setRejoinTableHistory(
                                        userData.userId,
                                        gameId,
                                        lobbyId,
                                        {
                                            userId: userData.userId,
                                            tableId,
                                            lobbyId,
                                            isEndGame: false,
                                        },
                                    );

                                    await Scheduler.addJob.LeaveTableTimerQueue({
                                        timer: LEAVE_TABLE_TIMER * NUMERICAL.THOUSAND,
                                        tableId,
                                        userId,
                                        currentRound,
                                    });
                                } else {
                                    playerLeave = true;
                                    flag = false;
                                    logger.info(
                                        `----->> userDisconnect :: TABLE_STATE :: ROUND_TIMER_STARTED `
                                    );
                                    logger.info(
                                        `----->> userDisconnect :: playerLeave :: ${playerLeave} And flag ::${flag}`
                                    );
                                }
                            } else {
                                // timer start
                                playerLeave = false;
                                flag = false;
                                logger.info(
                                    `----->> userDisconnect :: playerLeave :: TABLE STATE ::`,
                                    roundTableData.tableState
                                );
                                logger.info(
                                    `----->> userDisconnect :: playerLeave :: ${playerLeave} And flag ::${flag}`
                                );

                                // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                //     tableId,
                                //     data: {
                                //         isPopup: true,
                                //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_TOAST_POPUP,
                                //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                //         message:
                                //             MESSAGES.POPUP.TOP_TOAST_POP.DISCONNECTED_PLAYER_MESSAGE,
                                //         userId: userPlayingTable.userId,
                                //         seatIndex: userPlayingTable.seatIndex,
                                //     },
                                // });

                                userData.OldLobbyId = playingTable.lobbyId;

                                // set old tableIDs in userData
                                const userInfo = await setOldTableIdsHistory(userData, tableId);
                                userData.oldTableId = userInfo.oldTableId;

                                userData.tableId = tableId;

                                if (
                                    playingTable.rummyType === RUMMY_TYPES.DEALS_RUMMY ||
                                    playingTable.rummyType === RUMMY_TYPES.POINT_RUMMY
                                ) {
                                    userPlayingTable.isDisconneted = true;
                                    await setPlayerGamePlay(userId, tableId, userPlayingTable)
                                }
                                await setUser(userData.userId, userData);

                                // set rejoin history
                                await setRejoinTableHistory(
                                    userData.userId,
                                    gameId,
                                    lobbyId,
                                    {
                                        userId: userData.userId,
                                        tableId,
                                        lobbyId,
                                        isEndGame: false,
                                    },
                                );

                                await Scheduler.addJob.LeaveTableTimerQueue({
                                    timer: LEAVE_TABLE_TIMER * NUMERICAL.THOUSAND,
                                    tableId,
                                    userId,
                                    currentRound,
                                });
                            }
                            if (disconnectLocks) {
                                await getLock().release(disconnectLocks);
                                disconnectLocks = null;
                            }
                            logger.info(
                                `----->> userDisconnect :: playerLeave :: ${playerLeave} And flag ::${flag}`
                            );
                            if (playerLeave || flag) {
                                await leaveRoundTable(
                                    flag,
                                    playerLeave,
                                    userId,
                                    tableId,
                                    currentRound
                                );
                            }
                        }
                    } else {
                        logger.info(
                            "----->> userDisconnect : leave user on.",
                            "----->> userDisconnect : socketId :: 1 ::: ",
                            socket.id,
                            "userDisconnect : userPlayingTable.socketId :: ",
                            userPlayingTable.socketId
                        );

                        if (userPlayingTable.socketId == socket.id) {
                            if (disconnectLocks) {
                                await getLock().release(disconnectLocks);
                                disconnectLocks = null;
                            }
                            await leaveTable(tableId, socket);
                        }
                    }
                } else {
                    logger.warn("---->> userDisconnect : socketId :: not same ::");
                    logger.warn(`---->> userDisconnect :: userData SocketId :: ${userData.socketId} :: socket.id :: ${socket.id}`);
                }
            } else {
                logger.warn(
                    "---->> userDisconnect : data not proper in userDisconnect :: ",
                    socket.eventMetaData
                );
            }
        }
    } catch (error) {
        logger.error("----->> userDisconnect :: ERROR :: ", error);
        logger.error(
            `CATCH_ERROR : userDisconnect : userDisconnect :: userId: ${typeof socket.eventMetaData !== "undefined" &&
                typeof socket.eventMetaData.userId !== "undefined"
                ? socket.eventMetaData.userId
                : ""
            } :: tableId: ${typeof socket.eventMetaData !== "undefined" &&
                typeof socket.eventMetaData.tableId !== "undefined"
                ? socket.eventMetaData.tableId
                : ""
            } ::`,
            error
        );
    } finally {
        if (disconnectLocks) {
            await getLock().release(disconnectLocks);
        }
    }
}

export = userDisconnect;
