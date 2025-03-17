import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, REDIS, RUMMY_TYPES, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { markCompletedGameStatus } from "../../../../clientsideapi";
import commonEventEmitter from "../../../../commonEventEmitter";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { userIf } from "../../../../interfaces/userSignUpIf";
import { getLock } from "../../../../lock";
import { removePlayerGameData, setPlayerGamePlay } from "../../../cache/Players";
import { setRoundTableData } from "../../../cache/Rounds";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { setUser } from "../../../cache/User";
import { decrCounterLobbyWise, getOnliPlayerCountLobbyWise, removeOnliPlayerCountLobbyWise } from "../../../cache/onlinePlayer";
import formatLeaveTableInfo from "../../../formatResponse/formatLeaveTableInfo";
import countUserCards from "../../../utils/countUserCards";
import { setQueue } from "../../../utils/manageQueue";
import { setOldTableIdsHistory } from "../../../utils/setOldTableIdsHistory";
import { cardNotDiscardCard } from "../../turn/helper/nextTurnHelper";
import checkRoundWiner from "../../winner/checkRoundWiner";

export async function dealRummyLeaveRoundTable(
    roundTableData: roundTableIf,
    playerData: playerPlayingDataIf,
    playingTable: playingTableIf,
    userData: userIf,
    flag: boolean,
    playerLeave: boolean,
    leaveFlage: boolean,
) {
    const { currentRound, lobbyId, gameId, _id: tableId, gameType } = playingTable;
    let leaveTableLocks = await getLock().acquire([`locks:${tableId}`], 2000);
    try {
        const { userId } = playerData;

        if (
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LEFT &&
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LOST &&
            (roundTableData.currentPlayer > NUMERICAL.ONE || roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD || leaveFlage) &&
            (
                (roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD && roundTableData.isGameOver) ||
                (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD && roundTableData.totalPlayers > NUMERICAL.ONE) ||
                (leaveFlage && playingTable.dealType !== playingTable.currentRound)
            )
        ) {
            if (playerLeave && flag) {

                // for decrease online player in lobby
                await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

                // for if lobby active player is zero then remove key from redis
                const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
                if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

                const totalUserCards = await countUserCards(playerData.currentCards);

                logger.info("----->> leaveRoundTable :: totalUserCards ::", totalUserCards);

                if (totalUserCards === NUMERICAL.FOURTEEN) {
                    logger.info("----->> leaveRoundTable :: cardNotDiscardCard ::",)
                    const { roundTableInfo, currentPlayerData } = await cardNotDiscardCard(playerData, roundTableData, currentRound);
                    roundTableData = roundTableInfo;
                    playerData = currentPlayerData;
                }

                if (
                    (
                        roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.DROP_TABLE_ROUND &&
                        roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.WRONG_DECLARED &&
                        roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.WIN_ROUND
                    ) ||
                    leaveFlage
                ) {
                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                    playerData.gamePoints -= NUMERICAL.EIGHTEEN;
                    playerData.roundLostPoint = NUMERICAL.EIGHTEEN;
                }
                if (roundTableData.seats[`s${playerData.seatIndex}`].userStatus === PLAYER_STATE.WIN_ROUND) {
                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                }
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.LEFT;
                roundTableData.totalPlayers -= NUMERICAL.ONE;
                playerData.userStatus = PLAYER_STATE.LEFT;
                playerData.playingStatus = PLAYER_STATE.LEFT;
                playerData.isLeft = true;

                await setRoundTableData(tableId, currentRound, roundTableData);
                await setPlayerGamePlay(userId, tableId, playerData);

                let winPrice = roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundTableData.tableState === TABLE_STATE.ROUND_STARTED ?
                    ((roundTableData.maxPlayers === NUMERICAL.TWO || roundTableData.totalPlayers <= NUMERICAL.TWO) && currentRound === NUMERICAL.ONE ?
                        (NUMERICAL.TWO * playingTable.bootAmount) * (NUMERICAL.ONE - (playingTable.rake / NUMERICAL.HUNDRED)) : playingTable.winPrice) : playingTable.winPrice;

                winPrice = Number(winPrice.toFixed(NUMERICAL.TWO));

                let isLeaveBeforeLockIn = roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundTableData.tableState === TABLE_STATE.ROUND_STARTED ?
                    true : false;

                const formatedRes = await formatLeaveTableInfo(
                    tableId,
                    userId,
                    playerData.seatIndex,
                    currentRound,
                    roundTableData.tableState,
                    roundTableData.totalPlayers,
                    playerData.username,
                    winPrice,
                    isLeaveBeforeLockIn
                );

                logger.info("------->> leaveRoundTable :: formatLeaveTableInfo ::", formatedRes);

                commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
                    tableId,
                    socket: playerData.socketId,
                    data: formatedRes
                });

                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    tableId,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: `${playerData.username} is leave`,
                    }
                });

                await markCompletedGameStatus({
                    tableId,
                    gameId: gameId,
                    tournamentId: lobbyId
                },
                    userData.authToken,
                    playerData.socketId
                )

                await getLock().release(leaveTableLocks);
                leaveTableLocks = null;
                await removeRejoinTableHistory(userId, gameId, lobbyId);
                await checkRoundWiner(tableId, userId, currentRound);
            }

        }
        else {
            logger.warn("-------->> leaveRoundTable :: player state ::", roundTableData.seats[`s${playerData.seatIndex}`].userStatus);
            logger.warn("-------->> leaveRoundTable :: player state already left or lost");

            userData.OldLobbyId = lobbyId;
            await setUser(userData.userId, userData);

        }

        if (playerLeave && !flag) {

            // for decrease online player in lobby
            await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

            // for if lobby active player is zero then remove key from redis
            const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
            if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

            let winPrice = roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundTableData.tableState === TABLE_STATE.ROUND_STARTED ?
                ((roundTableData.maxPlayers === NUMERICAL.TWO || roundTableData.totalPlayers <= NUMERICAL.TWO) && currentRound === NUMERICAL.ONE ?
                    (NUMERICAL.TWO * playingTable.bootAmount) * (NUMERICAL.ONE - (playingTable.rake / NUMERICAL.HUNDRED)) : playingTable.winPrice) : playingTable.winPrice;

            winPrice = Number(winPrice.toFixed(NUMERICAL.TWO));

            let isLeaveBeforeLockIn = roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundTableData.tableState === TABLE_STATE.ROUND_STARTED ?
                true : false;

            let status = roundTableData.tableState;

            const msg: string | null = status === PLAYER_STATE.WATCHING_LEAVE ? PLAYER_STATE.WATCHING_LEAVE : null;

            const formatedRes = await formatLeaveTableInfo(
                tableId,
                userId,
                playerData.seatIndex,
                currentRound,
                roundTableData.tableState,
                roundTableData.totalPlayers,
                playerData.username,
                winPrice,
                isLeaveBeforeLockIn,
                msg
            )

            logger.info("------->> leaveRoundTable :: formatLeaveTableInfo ::", formatedRes);
            commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
                tableId,
                socket: playerData.socketId,
                data: formatedRes
            });

            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: `${playerData.username} is leave`,
                }
            });

            await markCompletedGameStatus({
                tableId,
                gameId: gameId,
                tournamentId: lobbyId
            },
                userData.authToken,
                playerData.socketId
            );

            if (
                roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
                roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
                roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED

            ) {
                await removePlayerGameData(userId, tableId);
            }

            await removeRejoinTableHistory(userId, gameId, lobbyId);
        }

    } catch (error) {
        logger.error(`---- deallRummyLeaveRoundTable :: ERROR :: `, error);
        throw error;
    } finally {
        if (leaveTableLocks) {
            await getLock().release(leaveTableLocks);
        }
    }
}