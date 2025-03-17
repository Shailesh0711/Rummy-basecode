import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, REDIS } from "../../../../../constants";
import logger from "../../../../../logger";
import { markCompletedGameStatus } from "../../../../clientsideapi";
import { multiPlayerWinnScore } from "../../../../clientsideapi/multiPlayerWinnScore";
import commonEventEmitter from "../../../../commonEventEmitter";
import { formateScoreIf, playersDataIf } from "../../../../interfaces/clientApiIf";
import { AutoSplitTimerQueueIf } from "../../../../interfaces/schedulerIf";
import { getPlayerGamePlay, removePlayerGameData, setPlayerGamePlay } from "../../../cache/Players";
import { removeRoundTableHistory } from "../../../cache/RoundHistory";
import { getRoundTableData, removeRoundTableData } from "../../../cache/Rounds";
import { removeScoreBoardHistory } from "../../../cache/ScoreBoardHistory";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { getTableData, removeTableData } from "../../../cache/Tables";
import { removeTurnHistoy } from "../../../cache/TurnHistory";
import { getUser, setUser } from "../../../cache/User";
import { decrCounterLobbyWise, getOnliPlayerCountLobbyWise, removeOnliPlayerCountLobbyWise } from "../../../cache/onlinePlayer";
import formatLeaveTableInfo from "../../../formatResponse/formatLeaveTableInfo";
import { formatMultiPlayerScore } from "../../../utils/formatMultiPlayerScore";
import cancelAllTimers from "../../winner/helper/cancelTimers";


async function autoSplitTimerExpire(data: AutoSplitTimerQueueIf) {
    try {
        logger.info("-------->> autoSplitTimerExpire :: data :: ", data)
        const { currentRound, tableId } = data;
        const userIds = [];
        const roundTableData = await getRoundTableData(tableId, currentRound);
        const tableData = await getTableData(tableId);
        const { lobbyId, gameId } = tableData;
        let token: string = ``;
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                userIds.push(roundTableData.seats[seat].userId)
            }
        }

        await cancelAllTimers(tableId, roundTableData.seats, true);
        const allPlayerDetails: formateScoreIf[] = [];

        for (const userId of userIds) {
            const playerData = await getPlayerGamePlay(userId, tableId);
            const userData = await getUser(userId);
            token = userData.authToken
            if (playerData && playerData.playingStatus === PLAYER_STATE.SPLIT_AMOUNT) {

                userData.balance += playerData.splitDetails.amount;

                await setUser(playerData.userId, userData)

                let nonProdMsg = "Play New Game"
                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket: playerData.socketId,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                        title: nonProdMsg,
                        message: `if you want to play game again, with Amount ${tableData.bootAmount}, please click yes`,
                        buttonCounts: NUMERICAL.TWO,
                        button_text: [
                            MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.YES,
                            MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT,
                        ],
                        button_color: [
                            MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.GREEN,
                            MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED,
                        ],
                        button_methods: [
                            MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.NEW_SIGNUP,
                            MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT,
                        ],
                    }
                })

                const obj: formateScoreIf = {
                    userId: userId,
                    winLossStatus: "Tie",
                    winningAmount: playerData.splitDetails.amount.toFixed(2),
                    score: playerData.gamePoints
                }

                allPlayerDetails.push(obj);

            } else {
                if (roundTableData.seats[`s${playerData.seatIndex}`].inGame) {

                    // for decrease online player in lobby
                    await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

                    // for if lobby active player is zero then remove key from redis
                    const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
                    if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

                    const formatedRes = await formatLeaveTableInfo(
                        tableId,
                        playerData.userId,
                        playerData.seatIndex,
                        currentRound,
                        roundTableData.tableState,
                        roundTableData.totalPlayers,
                        roundTableData.seats[`s${playerData.seatIndex}`].username,
                        tableData.winPrice,
                        false
                    );
                    logger.info("-------->> autoSplitTimerExpire :: formatLeaveTableInfo :: ", formatedRes);

                    commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
                        tableId,
                        socket: playerData.socketId,
                        data: formatedRes,
                    });
                }

                const obj: formateScoreIf = {
                    userId: userId,
                    winLossStatus: "Loss",
                    winningAmount: String(NUMERICAL.ZERO),
                    score: playerData.gamePoints
                }

                allPlayerDetails.push(obj);
            }

            await markCompletedGameStatus({
                tableId,
                gameId: gameId,
                tournamentId: lobbyId
            },
                userData.authToken,
                playerData.socketId
            );

            if (
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LEFT &&
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LOST
            ) {
                userData.OldLobbyId = "";
                await setUser(userId, userData);
                await removeRejoinTableHistory(userId, tableData.gameId, tableData.lobbyId);
            }
            await removePlayerGameData(userId, tableId)
        }

        // winner get data for client side api
        const apiData = await formatMultiPlayerScore(tableId, lobbyId, allPlayerDetails)

        // creadit amount for winner players
        await multiPlayerWinnScore(apiData, token);

        for (let i = NUMERICAL.ONE; i <= currentRound; i++) {
            await removeRoundTableData(tableId, i);
        }

        await removeTableData(tableId);
        await removeTurnHistoy(tableId);
        await removeRoundTableHistory(tableId);
        await removeScoreBoardHistory(tableId)

    } catch (error) {
        logger.error("--- autoSplitTimerExpire :: ERROR :: ", error);
    }
}

export = autoSplitTimerExpire;