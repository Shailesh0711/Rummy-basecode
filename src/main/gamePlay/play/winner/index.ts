import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../constants";
import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import { multiPlayerWinnScore } from "../../../clientsideapi";
import { markCompletedGameStatus } from "../../../clientsideapi/markCompletedGameStatus";
import commonEventEmitter from "../../../commonEventEmitter";
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { leaveClientInRoom } from "../../../socket";
import { getPlayerGamePlay, removePlayerGameData } from "../../cache/Players";
import { removeRoundTableHistory } from "../../cache/RoundHistory";
import { getRoundTableData, removeRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { removeScoreBoardHistory } from "../../cache/ScoreBoardHistory";
import { removeRejoinTableHistory } from "../../cache/TableHistory";
import { getTableData, popTableFromQueue, removeTableData } from "../../cache/Tables";
import { removeTurnHistoy } from "../../cache/TurnHistory";
import { getUser, setUser } from "../../cache/User";
import { formatLeaveTableInfo, formatWinnerInfo } from "../../formatResponse";
import { formatMultiPlayerScore } from "../../utils/formatMultiPlayerScore";
import cancelAllTimers from "./helper/cancelTimers";
import { getUserInfoForCreaditAmount } from "./helper/getUserInfoForCreaditAmount";

async function winner(
    tableId: string,
    roundTableData: roundTableIf,
    currentRound: number,
    lobbyId: string,
    gameId: string,
    userId: string,
    seatIndex: number,
): Promise<void> {
    logger.info("----------------------->> winner <<---------------------------")
    try {

        let winnerId: string = userId;
        let winnerSI: number = seatIndex;

        await cancelAllTimers(tableId, roundTableData.seats, true);
        logger.info("---->> winner :: userId :: ", winnerId);
        logger.info("---->> winner :: seatIndex :: ", winnerSI);

        const userInfo = await getUser(winnerId);
        logger.info("---->> winner :: userInfo :: ", userInfo);

        const tableData = await getTableData(tableId)
        logger.info("---->> winner :: tableData :: ", tableData);

        // for all player data to client side api
        const allPlayerDetails = await getUserInfoForCreaditAmount(tableId, winnerId, roundTableData.seats, tableData.winPrice)

        // winner get data for client side api
        const apiData = await formatMultiPlayerScore(tableId, lobbyId, allPlayerDetails)

        // creadit amount for winner players
        await multiPlayerWinnScore(apiData, userInfo.authToken);

        // for lobby tracking
        // await addLobbyTracking(tableId, tableData, roundTableData.splitPlayers);

        // save all round history in mongodb all scoreboard
        // await addAllRoundHistory(tableId)

        const playerData = await getPlayerGamePlay(userId, tableId);
        logger.info("---->> winner :: playerData :: ", playerData);

        // make game complate 
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                const userData = await getUser(roundTableData.seats[seat].userId)
                await markCompletedGameStatus({
                    tableId,
                    gameId: gameId,
                    tournamentId: lobbyId
                },
                    userData.authToken,
                    userData.socketId
                );
            }
        }

        userInfo.balance += tableData.winPrice;
        userInfo.OldLobbyId = "";
        await setUser(winnerId, userInfo);

        const formatedRes = await formatWinnerInfo(tableId, winnerId, winnerSI, tableData.winPrice, userInfo.balance);
        logger.info("---->> winner :: formatWinnerInfo :: ", formatedRes);

        // commonEventEmitter.emit(EVENTS.WINNER, {
        //     tableId,
        //     data: formatedRes
        // });

        let nonProdMsg = "Play New Game"
        commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
            socket: playerData.socketId,
            data: {
                isPopup: true,
                popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                title: nonProdMsg,
                message: `if you want to play game again, with Amount ${userInfo.bootAmount}, please click yes`,
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
        });

        // leave player from table
        await leaveClientInRoom(playerData.socketId, tableId);

        const userIDs = Object.keys(roundTableData.seats).map((seat) => {
            return roundTableData.seats[seat].userId
        })

        for await (const userId of userIDs) {
            await removePlayerGameData(userId, tableId);
        }

        for (let i = NUMERICAL.ONE; i <= currentRound; i++) {
            await removeRoundTableData(tableId, i);
        }
      
        await removeTableData(tableId);
        await removeTurnHistoy(tableId);
        await removeRoundTableHistory(tableId);
        await removeScoreBoardHistory(tableId);

    } catch (error) {
        logger.error("---winner :: ERROR: " + error);
        throw error;
    }
}

export = winner;

