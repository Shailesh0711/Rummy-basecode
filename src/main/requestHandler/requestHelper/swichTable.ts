import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../constants";
import logger from "../../../logger";
import socketAck from "../../../socketAck"
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData, setRoundTableData } from "../../gamePlay/cache/Rounds";
import { removeRejoinTableHistory } from "../../gamePlay/cache/TableHistory";
import { getTableData } from "../../gamePlay/cache/Tables";
import { getUser, setUser } from "../../gamePlay/cache/User";
import { leaveRoundTable } from "../../gamePlay/play/leaveTable/leaveRoundTable";
import { removeQueue } from "../../gamePlay/utils/manageQueue";
import { playingPlayerForTGP } from "../../gamePlay/utils/playingPlayerForTGP";
import { setOldTableIdsHistory } from "../../gamePlay/utils/setOldTableIdsHistory";
import { switchEventHelperRequestIf } from "../../interfaces/requestIf";
import { throwErrorIF } from "../../interfaces/throwError";
import { getLock } from "../../lock";
import { leaveClientInRoom } from "../../socket";
import { requestValidator } from "../../validator";
import { dropUpdateData } from "./helpers/dropUpdateData";

async function switchTableHandler(
    { data }: switchEventHelperRequestIf,
    socket: any,
    ack?: Function
) {
    let switchTableLock = await getLock().acquire([`locks:${data.tableId}`], 2000);
    try {
        data = await requestValidator.switchTableValidator(data);
        logger.info("------->> switchTableHandler :: data :: ", data);

        const tableId = socket.eventMetaData.userId.tableId || data.tableId;
        const currentRound = socket.eventMetaData.currentRound || data.currentRound;
        const userId = socket.eventMetaData.userId || data.userId;

        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DROP_ROUND_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        logger.info(`----->> switchTableHandler :: roundTableData ::`, roundTableData);

        if (roundTableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
            const playerData = await getPlayerGamePlay(userId, tableId);
            if (playerData === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.DROP_ROUND_ERROR,
                    message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }
            logger.info(`----->> switchTableHandler :: playerData ::`, playerData);
            const tableData = await getTableData(tableId)
            logger.info(`----->> switchTableHandler :: tableData ::`, tableData);
            const playingPlayerCount = await playingPlayerForTGP(roundTableData);

            logger.info(`----->> switchTableHandler :: playingPlayerCount ::`, playingPlayerCount);

            let cutPoints: number;
            if (
                roundTableData && roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD &&
                roundTableData.tableState !== TABLE_STATE.ROUND_OVER &&
                playingPlayerCount > NUMERICAL.ONE
            ) {
                if (
                    playerData.playingStatus !== PLAYER_STATE.DROP_TABLE_ROUND &&
                    playerData.playingStatus !== PLAYER_STATE.LEFT &&
                    playerData.playingStatus !== PLAYER_STATE.LOST
                ) {

                    if (roundTableData && roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD && roundTableData.tableState !== TABLE_STATE.ROUND_OVER) {
                        if (playingPlayerCount > NUMERICAL.ONE) {
                            if (roundTableData.tableState === TABLE_STATE.TURN_STARTED) {

                                if (tableData.maximumSeat === NUMERICAL.TWO) {

                                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                        socket,
                                        data: {
                                            isPopup: true,
                                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                            message: MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_NOT_ALLOWED,
                                        }
                                    });

                                } else {
                                    if (playerData.countTurns > NUMERICAL.ZERO) {
                                        cutPoints = 40;
                                        roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND;
                                        roundTableData.currentPlayer -= 1;
                                        roundTableData.isDropOrLeave = true;
                                        await setRoundTableData(tableId, currentRound, roundTableData);
                                        await dropUpdateData(userId, tableId, cutPoints, playerData);
                                    }
                                    else {
                                        cutPoints = 20;
                                        roundTableData.currentPlayer -= 1;
                                        roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.DROP_TABLE_ROUND
                                        roundTableData.isDropOrLeave = true;
                                        await setRoundTableData(tableId, currentRound, roundTableData);
                                        await dropUpdateData(userId, tableId, cutPoints, playerData);
                                    }

                                }
                            } else {
                                logger.warn(
                                    "----->> switchTableHandler :: round turn not started yet !",
                                    "userId ::",
                                    data.userId
                                );
                                await dropUpdateData(userId, tableId, NUMERICAL.ZERO, playerData, false);
                                // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                                //     socket,
                                //     data: {
                                //         isPopup: true,
                                //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                                //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                                //         message: roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START ?
                                //             MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_WHEN_FINISHING_STATE : roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START ?
                                //                 MESSAGES.POPUP.MIDDLE_TOAST_POP.DROP_WHEN_ROUND_OVER_STATE : MESSAGES.POPUP.MIDDLE_TOAST_POP.TABLE_TURN_STATE_POPUP_MESSAGE,
                                //     }
                                // });
                            }
                        } else {
                            logger.warn(
                                "----->> switchTableHandler :: only one player left in table",
                                "userId ::",
                                data.userId
                            );
                        }
                    } else {
                        logger.warn(
                            "----->> switchTableHandler :: table state is display scoreboard",
                            "userId ::",
                            data.userId
                        );
                    }
                }

                if (switchTableLock) {
                    await getLock().release(switchTableLock);
                    switchTableLock = null;
                }
                console.log(`SwitchTableHandler :: ACK :: `, ack);

                if (ack) {
                    let userData = await getUser(userId);
                    playerData.isSwitchTable = true;
                    await setPlayerGamePlay(userId, tableId, playerData);
                    await removeRejoinTableHistory(userId, tableData.gameId, tableData.lobbyId);
                    await leaveClientInRoom(socket, tableId);
                    userData = await setOldTableIdsHistory(userData, tableId);
                    await setUser(userId, userData)
                    await socketAck.ackMid(
                        EVENTS.SWITCH_TABLE_SOCKET_EVENT,
                        {},
                        userId,
                        tableId,
                        ack
                    );
                    await leaveRoundTable(true, true, playerData.userId, tableId, currentRound, true);
                }
            }
        }
    } catch (error) {
        logger.info(`---- switchTableHandler :: ERROR :: `, error);
    } finally {
        if (switchTableLock) {
            await getLock().release(switchTableLock);
        }
    }
}

export = switchTableHandler;