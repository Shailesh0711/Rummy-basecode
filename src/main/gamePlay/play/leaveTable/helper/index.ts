import { EVENTS, MESSAGES, NUMERICAL, REDIS, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { getPlayerGamePlay, removePlayerGameData } from "../../../cache/Players";
import { getRoundTableData, removeRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { popTableFromQueue, removeTableData, setTableData } from "../../../cache/Tables";
import Scheduler from "../../../../scheduler";
import commonEventEmitter from "../../../../commonEventEmitter";
import config from "../../../../../connections/config";
import { formatLeaveTableInfo } from "../../../formatResponse";
import { removeTurnHistoy } from "../../../cache/TurnHistory";
import { removeScoreBoardHistory } from "../../../cache/ScoreBoardHistory";
import { removeRoundTableHistory } from "../../../cache/RoundHistory";
import { removeQueue, setQueue } from "../../../utils/manageQueue";
import { PREFIX } from "../../../../../constants/redis";
import { getUser, setUser } from "../../../cache/User";
import { decrCounterLobbyWise, getOnliPlayerCountLobbyWise, removeOnliPlayerCountLobbyWise } from "../../../cache/onlinePlayer";
import { markCompletedGameStatus } from "../../../../clientsideapi";
import cancelAllTimers from "../../winner/helper/cancelTimers";
import { setOldTableIdsHistory } from "../../../utils/setOldTableIdsHistory";

const userLeaveOnWaitForPlayer = async (
  userId: string,
  seatIndex: number,
  playingTable: playingTableIf,
  isBackground: boolean
) => {
  logger.info("---userLeaveOnWaitForPlayer :: userId :::", userId);
  logger.info("---userLeaveOnWaitForPlayer :: isBackground :::", isBackground);
  const { gameId, lobbyId, gameType, _id, currentRound }: any = playingTable;
  try {
    const playerData = await getPlayerGamePlay(userId, playingTable._id);
    const roundTableData = await getRoundTableData(_id, currentRound)
    roundTableData.totalPlayers -= 1;

    // for decrease online player in lobby
    await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

    // for if lobby active player is zero then remove key from redis
    const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
    if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

    let winPrice = roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundTableData.tableState === TABLE_STATE.ROUND_STARTED ?
      ((roundTableData.maxPlayers === NUMERICAL.TWO || roundTableData.totalPlayers <= NUMERICAL.TWO) && currentRound === NUMERICAL.ONE ?
        (NUMERICAL.TWO * playingTable.bootAmount) * (NUMERICAL.ONE - (playingTable.rake / 100)) : playingTable.winPrice) : playingTable.winPrice;

    winPrice = Number(winPrice.toFixed(2));

    let isLeaveBeforeLockIn = roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundTableData.tableState === TABLE_STATE.ROUND_STARTED ?
      true : false;

    const formatedRes = await formatLeaveTableInfo(
      _id,
      userId,
      seatIndex,
      currentRound,
      roundTableData.tableState,
      roundTableData.totalPlayers,
      playerData.username,
      winPrice,
      isLeaveBeforeLockIn
    )
    logger.info("---userLeaveOnWaitForPlayer :: formatLeaveTableInfo :::", formatedRes);
    if (!isBackground) {
      commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
        tableId: _id,
        socket: playerData.socketId,
        data: formatedRes
      });

      const userData = await getUser(userId);
      logger.info("---userLeaveOnWaitForPlayer :: userData :::", userData);

      await markCompletedGameStatus({
        tableId: _id,
        gameId: gameId,
        tournamentId: lobbyId
      },
        userData.authToken,
        playerData.socketId
      );

      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        tableId: _id,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
          title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
          message: `${playerData.username} is leave`,
        }
      });
    }

    for await (const seat of Object.keys(roundTableData.seats)) {
      if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
        await removePlayerGameData(roundTableData.seats[seat].userId, playingTable._id);
      }
    }

    // await popTableFromQueue(`${PREFIX.LOBBY_HISTORY}:${userId}`)
    await removeTableData(playingTable._id)
    await removeRoundTableData(playingTable._id, playingTable.currentRound);
    await removeRejoinTableHistory(userId, gameId, lobbyId);
    await removeTurnHistoy(playingTable._id);
    await removeScoreBoardHistory(playingTable._id);
    await removeRoundTableHistory(playingTable._id);
    await removeQueue(`${gameType}:${gameId}:${lobbyId}`, playingTable._id);
  } catch (error) {
    logger.error("---userLeaveOnWaitForPlayer :: ERROR :: " + error);
    throw error;
  }
}

const userLeaveOnWaitingPlayer = async (
  userId: string,
  roundPlayingTable: roundTableIf,
  playingTable: playingTableIf,
): Promise<boolean> => {
  logger.info("---->> userLeaveOnWaitingPlayer :: userId :::", userId);

  const { gameId, lobbyId, gameType, _id, currentRound }: any = playingTable;
  const queueKey = `${gameType}:${gameId}:${lobbyId}`
  try {

    for await (const key of Object.keys(roundPlayingTable.seats)) {
      if (roundPlayingTable.seats[key].length != 0) {
        if (roundPlayingTable.seats[key].userId === userId)
          roundPlayingTable.seats[key] = {};
      }
    }

    roundPlayingTable.totalPlayers -= 1;
    roundPlayingTable.currentPlayer -= 1;

    playingTable.winPrice = playingTable.winPrice - (playingTable.bootAmount * (NUMERICAL.ONE - (playingTable.rake / 100)));

    await setTableData(playingTable);

    if (roundPlayingTable.totalPlayers < playingTable.minPlayerForPlay) {
      logger.info("----->> userLeaveOnWaitingPlayer :: show wait popup :::");

      // cancal Waiting timer 
      // await Scheduler.cancelJob.WaitingPlayerCancel(playingTable._id);
      await cancelAllTimers(playingTable._id, roundPlayingTable.seats, true);
      // roundPlayingTable.tableState = TABLE_STATE.WAITING_FOR_PLAYERS;

      if (roundPlayingTable.totalPlayers < NUMERICAL.ONE) {
        const playerData = await getPlayerGamePlay(userId, playingTable._id);

        // for decrease online player in lobby
        await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

        // for if lobby active player is zero then remove key from redis
        const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
        if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

        let winPrice = roundPlayingTable.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundPlayingTable.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundPlayingTable.tableState === TABLE_STATE.ROUND_STARTED ?
          ((roundPlayingTable.maxPlayers === NUMERICAL.TWO || roundPlayingTable.totalPlayers <= NUMERICAL.TWO) && currentRound === NUMERICAL.ONE ?
            (NUMERICAL.TWO * playingTable.bootAmount) * (NUMERICAL.ONE - (playingTable.rake / 100)) : playingTable.winPrice) : playingTable.winPrice;

        winPrice = Number(winPrice.toFixed(2));

        let isLeaveBeforeLockIn = roundPlayingTable.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundPlayingTable.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundPlayingTable.tableState === TABLE_STATE.ROUND_STARTED ?
          true : false;

        const formatedRes = await formatLeaveTableInfo(
          _id,
          userId,
          playerData.seatIndex,
          currentRound,
          roundPlayingTable.tableState,
          roundPlayingTable.totalPlayers,
          playerData.username,
          winPrice,
          isLeaveBeforeLockIn
        )

        commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
          tableId: _id,
          socket: playerData.socketId,
          data: formatedRes
        });

        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
          tableId: _id,
          data: {
            isPopup: true,
            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            message: `${playerData.username} is leave`,
          }
        });

        const userData = await getUser(userId)
        logger.info("----->> userLeaveOnWaitingPlayer :: userData :::", userData);

        // set oldtableIDs in userData
        const userInfo = await setOldTableIdsHistory(userData, playingTable._id);
        userData.oldTableId = userInfo.oldTableId;

        await setUser(userId, userData)

        await markCompletedGameStatus({
          tableId: _id,
          gameId: gameId,
          tournamentId: lobbyId
        },
          userData.authToken,
          playerData.socketId
        );

        await removeTableData(playingTable._id);
        await removeRoundTableData(playingTable._id, playingTable.currentRound);
        await removeTurnHistoy(playingTable._id);
        await removeScoreBoardHistory(playingTable._id);
        await removeRoundTableHistory(playingTable._id);
        await removeQueue(`${gameType}:${gameId}:${lobbyId}`, playingTable._id);
        await removePlayerGameData(userId, playingTable._id);
        await removeRejoinTableHistory(userId, gameId, lobbyId);

        return false;
      } else {

        const playerData = await getPlayerGamePlay(userId, playingTable._id);
        let winPrice = (roundPlayingTable.maxPlayers === NUMERICAL.TWO || roundPlayingTable.totalPlayers <= NUMERICAL.TWO) && currentRound === NUMERICAL.ONE ?
          (NUMERICAL.TWO * playingTable.bootAmount) * (NUMERICAL.ONE - (playingTable.rake / 100)) : playingTable.winPrice;

        winPrice = Number(winPrice.toFixed(2));

        let isLeaveBeforeLockIn = roundPlayingTable.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundPlayingTable.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundPlayingTable.tableState === TABLE_STATE.ROUND_STARTED ?
          true : false;

        const formatedRes = await formatLeaveTableInfo(
          playingTable._id,
          playerData.userId,
          playerData.seatIndex,
          currentRound,
          roundPlayingTable.tableState,
          roundPlayingTable.totalPlayers,
          playerData.username,
          winPrice,
          isLeaveBeforeLockIn
        )

        logger.info("------->> userLeaveOnLock :: formatLeaveTableInfo ::", formatedRes);
        commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
          tableId: playingTable._id,
          socket: playerData.socketId,
          data: formatedRes
        });

        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
          tableId: playingTable._id,
          data: {
            isPopup: true,
            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            message: `${playerData.username} is leave`,
          }
        });
        roundPlayingTable.tableState = TABLE_STATE.WAIT_FOR_PLAYER;

        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
          tableId: playingTable._id,
          data: {
            isPopup: true,
            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            message: MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE,
          }
        });
        await setRoundTableData(
          playingTable._id,
          playingTable.currentRound,
          roundPlayingTable,
        );
        await setQueue(queueKey, _id);
        await removePlayerGameData(userId, playingTable._id);
        await removeRejoinTableHistory(userId, gameId, lobbyId);

        return false;
      }
    } else {
      await setRoundTableData(
        playingTable._id,
        playingTable.currentRound,
        roundPlayingTable,
      );
      // await removePlayerGameData(userId, playingTable._id);
      await removeRejoinTableHistory(userId, gameId, lobbyId);

      return true;
    }

    // await popTableFromQueue(`${PREFIX.LOBBY_HISTORY}:${userId}`)
  } catch (e) {
    logger.error(
      `CATCH_ERROR : userLeaveOnWaitingPlayer : lobbyId: ${lobbyId} : gameType: ${gameType} : gameId: ${gameId} : tableId: ${playingTable._id}:: `,
      e,
    );
    throw e;
  }
};


const userLeaveOnLock = async (
  playerInfo: playerPlayingDataIf,
  roundPlayingTable: roundTableIf,
  playingTable: playingTableIf,
) => {
  const {
    _id: tableId,
    currentRound,
    gameId,
    lobbyId,
    gameType,
  } = playingTable;
  try {
    logger.info("----->> userLeaveOnLock :: userId :::", playerInfo.userId);
    let sendStatus = false;
    if (roundPlayingTable.tableState === TABLE_STATE.ROUND_TIMER_STARTED) {
      const queueKey = `${gameType}:${gameId}:${lobbyId}`;

      for await (const key of Object.keys(roundPlayingTable.seats)) {
        if (roundPlayingTable.seats[key].length != 0) {
          if (roundPlayingTable.seats[key].userId === playerInfo.userId)
            roundPlayingTable.seats[key] = {};
        }
      }

      // const userData = await getUser(playerInfo.userId);

      // userData.OldLobbyId = "";

      // await setUser(playerInfo.userId, userData)

      roundPlayingTable.totalPlayers -= 1;
      roundPlayingTable.currentPlayer -= 1;

      playingTable.winPrice = playingTable.winPrice - (playingTable.bootAmount * (NUMERICAL.ONE - (playingTable.rake / 100)));

      await setTableData(playingTable);

      let winPrice = (roundPlayingTable.maxPlayers === NUMERICAL.TWO || roundPlayingTable.totalPlayers <= NUMERICAL.TWO) && currentRound === NUMERICAL.ONE ?
        (NUMERICAL.TWO * playingTable.bootAmount) * (NUMERICAL.ONE - (playingTable.rake / 100)) : playingTable.winPrice;

      winPrice = Number(winPrice.toFixed(2));

      let isLeaveBeforeLockIn = true

      const formatedRes = await formatLeaveTableInfo(
        tableId,
        playerInfo.userId,
        playerInfo.seatIndex,
        currentRound,
        roundPlayingTable.tableState,
        roundPlayingTable.totalPlayers,
        playerInfo.username,
        winPrice,
        isLeaveBeforeLockIn
      )

      logger.info("------->> userLeaveOnLock :: formatLeaveTableInfo ::", formatedRes);
      commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
        tableId,
        socket: playerInfo.socketId,
        data: formatedRes
      });

      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        tableId,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOP_MIDDLE_TOAST_POPUP,
          title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
          message: `${playerInfo.username} is leave`,
        }
      });

      if (roundPlayingTable.totalPlayers < playingTable.minPlayerForPlay) {
        logger.info("----->> userLeaveOnWaitingPlayer :: show wait popup :::");

        // await Scheduler.cancelJob.initializeGameTimerCancel(playingTable._id);
        await cancelAllTimers(playingTable._id, roundPlayingTable.seats, true);
        // roundPlayingTable.tableState = TABLE_STATE.WAITING_FOR_PLAYERS;
        roundPlayingTable.tableState = TABLE_STATE.WAIT_FOR_PLAYER;
        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
          tableId: playingTable._id,
          data: {
            isPopup: true,
            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
            message: MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE,
          }
        });

        await setRoundTableData(
          playingTable._id,
          playingTable.currentRound,
          roundPlayingTable,
        );
        await setQueue(queueKey, playingTable._id);

      } else {
        await setRoundTableData(
          playingTable._id,
          playingTable.currentRound,
          roundPlayingTable,
        );
      }

      // await popTableFromQueue(`${PREFIX.LOBBY_HISTORY}:${playerInfo.userId}`)
      await removePlayerGameData(playerInfo.userId, playingTable._id);
      await removeRejoinTableHistory(playerInfo.userId, gameId, lobbyId);

    } else if (
      roundPlayingTable.tableState === TABLE_STATE.LOCK_IN_PERIOD ||
      roundPlayingTable.tableState === TABLE_STATE.COLLECTING_BOOT_VALUE ||
      roundPlayingTable.tableState === TABLE_STATE.TOSS_CARDS
    ) {
      sendStatus = true;
    }
    return sendStatus;
  } catch (error) {
    logger.error("----->> userLeaveOnLock :: ERROR: ", error);
    throw error;
  }
};

const exportObject = {
  userLeaveOnWaitForPlayer,
  userLeaveOnWaitingPlayer,
  userLeaveOnLock,
};

export = exportObject;