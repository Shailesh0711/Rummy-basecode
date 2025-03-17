import {
  EVENTS,
  MESSAGES,
  NUMERICAL,
  PLAYER_STATE,
  REDIS,
  RUMMY_TYPES,
  TABLE_STATE,
} from "../../../../../constants";
import logger from "../../../../../logger";
import { checkBalance } from "../../../../clientsideapi";
import commonEventEmitter from "../../../../commonEventEmitter";
import { roundTableIf, userSeatsIf } from "../../../../interfaces/roundTableIf";
import {
  getPlayerGamePlay,
  removePlayerGameData,
} from "../../../cache/Players";
import {
  getRoundTableData,
  removeRoundTableData,
  setRoundTableData,
} from "../../../cache/Rounds";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { getUser } from "../../../cache/User";
import {
  decrCounterLobbyWise,
  getOnliPlayerCountLobbyWise,
  removeOnliPlayerCountLobbyWise,
} from "../../../cache/onlinePlayer";
import defaultRoundTableData from "../../../defaultGenerator/defaultRoundTableData";
import { leaveRoundTable } from "../../leaveTable/leaveRoundTable";

export async function reRoundTable(
  oldTableId: string,
  newTableId: string,
  dealType: number,
  maximumSeat: number,
  oldTableTotalRounds: number,
  gameId: string,
  lobbyId: string,
  currentRound: number,
  connectedSocketIds: string[],
  minPlayerForPlay: number
): Promise<{
  newRoundTableData: roundTableIf;
  isNewGame: boolean;
}> {
  try {
    let seats = {} as userSeatsIf;
    let allSeats = {} as userSeatsIf;
    logger.info(`------------------>> reRoundTable <<------------------`);
    const oldRoundTableData = await getRoundTableData(oldTableId, currentRound);

    logger.info(
      `------>> reTableConfig :: oldRoundTableData :: `,
      oldRoundTableData
    );

    let newRoundTableData = await defaultRoundTableData({
      tableId: newTableId,
      dealType: dealType,
      totalPlayers: maximumSeat,
      rummyType: oldRoundTableData.rummyType,
    });

    // filter seats
    for await (const seat of Object.keys(oldRoundTableData.seats)) {
      if (Object.keys(oldRoundTableData.seats[seat]).length > NUMERICAL.ZERO) {
        if (
          oldRoundTableData.seats[seat].userStatus !== PLAYER_STATE.LEFT &&
          oldRoundTableData.seats[seat].userStatus !== PLAYER_STATE.LOST
        ) {
          const playerData = await getPlayerGamePlay(
            oldRoundTableData.seats[seat].userId,
            oldTableId
          );
          logger.info(`------>> reTableConfig :: playerData :: `, playerData);
          if (
            playerData &&
            !playerData.isDisconneted &&
            connectedSocketIds.includes(playerData.socketId)
          ) {
            const userData = await getUser(playerData.userId);
            logger.info(`------>> reTableConfig :: userData :: `, userData);

            // check balance for play new game
            let checkBalanceDetail = await checkBalance(
              { tournamentId: userData.lobbyId },
              userData.authToken,
              userData.socketId,
              userData.userId
            );
            logger.info(
              userData.userId,
              "checkBalanceDetail  :: >> ",
              checkBalanceDetail
            );
            if (
              checkBalanceDetail &&
              checkBalanceDetail.userBalance.isInsufficiantBalance
            ) {
              console.log(
                "isInsufficiantBalance ::",
                checkBalanceDetail.userBalance.isInsufficiantBalance
              );

              commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: playerData.socketId,
                data: {
                  isPopup: true,
                  popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                  title: MESSAGES.GRPC_ERRORS.MSG_GRPC_INSUFFICIENT_FUNDS,
                  buttonCounts: NUMERICAL.ONE,
                  button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                  button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                  button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
              });

              await removeRejoinTableHistory(
                oldRoundTableData.seats[seat].userId,
                gameId,
                lobbyId
              );
              await leaveRoundTable(
                false,
                true,
                playerData.userId,
                oldTableId,
                currentRound
              );

              // for decrease online player in lobby
              await decrCounterLobbyWise(
                REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
                lobbyId
              );

              // for if lobby active player is zero then remove key from redis
              const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(
                REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
                lobbyId
              );
              if (lobbyWiseCounter == NUMERICAL.ZERO) {
                await removeOnliPlayerCountLobbyWise(
                  REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
                  lobbyId
                );
              }
            } else {
              oldRoundTableData.seats[seat].userStatus = PLAYER_STATE.PLAYING;
              seats[seat] = oldRoundTableData.seats[seat];
            }
          } else {
            // for decrease online player in lobby
            await decrCounterLobbyWise(
              REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
              lobbyId
            );

            // for if lobby active player is zero then remove key from redis
            const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(
              REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
              lobbyId
            );
            if (lobbyWiseCounter == NUMERICAL.ZERO) {
              await removeOnliPlayerCountLobbyWise(
                REDIS.PREFIX.ONLINE_PLAYER_LOBBY,
                lobbyId
              );
            }

            // leave event for disconnect players
            if (playerData && playerData.isDisconneted) {
              await leaveRoundTable(
                false,
                true,
                playerData.userId,
                oldTableId,
                currentRound
              );
            }
          }
          await removeRejoinTableHistory(
            oldRoundTableData.seats[seat].userId,
            gameId,
            lobbyId
          );
        }

        // remove player data
        await removePlayerGameData(
          oldRoundTableData.seats[seat].userId,
          oldTableId
        );
      }
    }

    // remove all old rounds table data
    for (let i = NUMERICAL.ONE; i <= oldTableTotalRounds; i++) {
      await removeRoundTableData(oldTableId, i);
    }

    logger.info(`------>> reTableConfig :: seats :: `, seats);
    logger.info(
      `------>> reTableConfig :: Object.keys(seats).length :: `,
      Object.keys(seats).length
    );
    if (Object.keys(seats).length > NUMERICAL.ZERO) {
      if (oldRoundTableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
        // add emety seats
        for (let i = NUMERICAL.ZERO; i < maximumSeat; i++) {
          if (!seats[`s${i}`]) {
            allSeats[`s${i}`] = {};
          } else {
            allSeats[`s${i}`] = seats[`s${i}`];
          }
        }
      }

      if (oldRoundTableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {
        let seatCount = NUMERICAL.ZERO;

        for (const seat of Object.keys(seats)) {
          if (Object.keys(seat).length > NUMERICAL.ZERO) {
            if (`s${seatCount}` === seat) {
              allSeats[`s${seatCount}`] = seats[seat];
            } else {
              seats[seat].seatIndex = seatCount;
              allSeats[`s${seatCount}`] = seats[seat];
            }
            seatCount += NUMERICAL.ONE;
          }
        }

        for (let i = 0; i < maximumSeat; i++) {
          if (!allSeats[`s${i}`]) {
            allSeats[`s${i}`] = {};
          }
        }
      }

      logger.info(`------>> reTableConfig :: allSeats :: `, allSeats);

      newRoundTableData.tableState =
        maximumSeat === minPlayerForPlay
          ? TABLE_STATE.ROUND_TIMER_STARTED
          : Object.keys(seats).length >= minPlayerForPlay
          ? TABLE_STATE.WAITING_FOR_PLAYERS
          : TABLE_STATE.WAIT_FOR_PLAYER;
      newRoundTableData.seats = allSeats;
      newRoundTableData.currentPlayer = Object.keys(seats).length;
      newRoundTableData.totalPlayers = Object.keys(seats).length;

      await setRoundTableData(newTableId, NUMERICAL.ONE, newRoundTableData);
      logger.info(
        `------>> reTableConfig :: newRoundTableData :: `,
        newRoundTableData
      );

      return {
        newRoundTableData,
        isNewGame: true,
      };
    } else {
      return {
        newRoundTableData,
        isNewGame: false,
      };
    }
  } catch (error) {
    console.log("--- reRoundTable :: ERROR :: ", error);
    logger.error("--- reRoundTable :: ERROR :: ", error);
    throw error;
  }
}
