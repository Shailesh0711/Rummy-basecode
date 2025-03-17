import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, REDIS, RUMMY_TYPES, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { userIf } from "../../../../interfaces/userSignUpIf";
import { getLock } from "../../../../lock";
import { removePlayerGameData, setPlayerGamePlay } from "../../../cache/Players";
import { setRoundTableData } from "../../../cache/Rounds";
import Schedular from "../../../../scheduler";
import ScoreBoard from "../../scoreBoard/scoreBoad";
import { decrCounterLobbyWise, getOnliPlayerCountLobbyWise, removeOnliPlayerCountLobbyWise } from "../../../cache/onlinePlayer";
import countUserCards from "../../../utils/countUserCards";
import { cardNotDiscardCard } from "../../turn/helper/nextTurnHelper";
import formatLeaveTableInfo from "../../../formatResponse/formatLeaveTableInfo";
import commonEventEmitter from "../../../../commonEventEmitter";
import { markCompletedGameStatus } from "../../../../clientsideapi";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import checkRoundWiner from "../../winner/checkRoundWiner";
import { setUser } from "../../../cache/User";
import { setQueue } from "../../../utils/manageQueue";
import { setOldTableIdsHistory } from "../../../utils/setOldTableIdsHistory";

export async function poolRummyLeaveRoundTable(
    roundTableData: roundTableIf,
    playerData: playerPlayingDataIf,
    playingTable: playingTableIf,
    userData: userIf,
    flag: boolean,
    playerLeave: boolean,
    leaveFlage: boolean,
) {
    const { currentRound, gameType, lobbyId, gameId, _id: tableId } = playingTable;
    let leaveTableLocks = await getLock().acquire([`locks:${tableId}`], 2000);
    try {

        logger.info("------->> poolRummyLeaveRoundTable :: tableId ::", tableId);

        const { userId } = playerData;

        if (playerData.isWaitingForRejoinPlayer) {

            flag = false;

            roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.LOST

            playerData.playingStatus = PLAYER_STATE.LOST;
            playerData.userStatus = PLAYER_STATE.LOST;
            playerData.isWaitingForRejoinPlayer = false;

            let count: number = NUMERICAL.ZERO;

            for await (const userID of roundTableData.eliminatedPlayers) {
                if (userId === userID) {
                    roundTableData.eliminatedPlayers.splice(count, NUMERICAL.ONE);
                    break;
                }
                count += NUMERICAL.ONE;
            }

            await setPlayerGamePlay(playerData.userId, tableId, playerData);
            await setRoundTableData(tableId, currentRound, roundTableData);

            if (roundTableData.eliminatedPlayers.length === NUMERICAL.ZERO) {

                // cancel timer
                await Schedular.cancelJob.rejoinGamePopupCancel(tableId);

                await setRoundTableData(tableId, currentRound, roundTableData);

                await ScoreBoard(tableId, currentRound, false, true);
            }

        }

        if (
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LEFT &&
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LOST &&
            roundTableData.totalPlayers > NUMERICAL.ONE &&
            (roundTableData.currentPlayer > NUMERICAL.ONE || leaveFlage || roundTableData.tableState === TABLE_STATE.DISPLAY_SCOREBOARD) &&
            (roundTableData.tableState !== TABLE_STATE.DISPLAY_SCOREBOARD || leaveFlage)
        ) {

            if (playerLeave && flag) {

                // for decrease online player in lobby
                await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

                // for if lobby active player is zero then remove key from redis
                const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
                if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

                const totalUserCards = await countUserCards(playerData.currentCards);

                logger.info("----->> poolRummyLeaveRoundTable :: totalUserCards ::", totalUserCards);

                if (totalUserCards === NUMERICAL.FOURTEEN) {

                    logger.info("----->> poolRummyLeaveRoundTable :: cardNotDiscardCard ::",);

                    const { roundTableInfo, currentPlayerData } = await cardNotDiscardCard(playerData, roundTableData, currentRound);
                    roundTableData = roundTableInfo;
                    playerData = currentPlayerData;

                }

                if (
                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.DROP_TABLE_ROUND &&
                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.WRONG_DECLARED &&
                    roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.WIN_ROUND
                ) {

                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                    playerData.gamePoints += playerData.poolType === NUMERICAL.SIXTY_ONE ? NUMERICAL.SIXTY : NUMERICAL.EIGHTEEN;
                    playerData.roundLostPoint = playerData.poolType === NUMERICAL.SIXTY_ONE ? NUMERICAL.SIXTY : NUMERICAL.EIGHTEEN;

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
                )

                logger.info("------->> poolRummyLeaveRoundTable :: formatLeaveTableInfo ::", formatedRes);

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

                // await popTableFromQueue(`${PREFIX.LOBBY_HISTORY}:${playerData.userId}`);
                await removeRejoinTableHistory(userId, gameId, lobbyId);

                if (leaveTableLocks) {
                    await getLock().release(leaveTableLocks);
                    leaveTableLocks = null;
                }
                await checkRoundWiner(tableId, userId, currentRound);
            }

        } else {
            logger.warn("-------->> poolRummyLeaveRoundTable :: player state ::", roundTableData.seats[`s${playerData.seatIndex}`].userStatus);
            logger.warn("-------->> poolRummyLeaveRoundTable :: player state already left or lost");

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

            logger.info("------->> poolRummyLeaveRoundTable :: formatLeaveTableInfo ::", formatedRes);
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
        logger.error(`---- poolRummyLeaveRoundTable :: ERROR :: `, error);
        throw error;
    } finally {
        if (leaveTableLocks) {
            await getLock().release(leaveTableLocks);
        }
    }
}