import { EVENTS, NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { markCompletedGameStatus, multiPlayerWinnScore } from "../../../../clientsideapi";
import commonEventEmitter from "../../../../commonEventEmitter";
import { formateScoreIf } from "../../../../interfaces/clientApiIf";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { removeRoundTableHistory } from "../../../cache/RoundHistory";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { removeScoreBoardHistory } from "../../../cache/ScoreBoardHistory";
import { setTableData } from "../../../cache/Tables";
import { removeTurnHistoy } from "../../../cache/TurnHistory";
import { getUser, setUser } from "../../../cache/User";
import { formatGameTableInfo } from "../../../formatResponse";
import { formatMultiPlayerScore } from "../../../utils/formatMultiPlayerScore";
import getPlayerIdForRoundTable from "../../../utils/getPlayerIdForRoundTable";
import roundHistory from "../../History/roundHistory";
import { newGameStart } from "../../newGameStart";
import selectDealer from "../../turn/selectDealer";
import cancelAllTimers from "../../winner/helper/cancelTimers";
import filterPlayerForNextRound from "../helper/filterPlayerForNextRound";
import filterRoundTableForNextRound from "../helper/filterRoundTableForNextRound";
import { setScoketData } from "../helper/setSocketData";
import startRound from "../startRound";

export async function dealRummyNextRound(
    tableData: playingTableIf,
    currentRound: number
) {
    try {
        const { _id: tableId } = tableData;
        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("------>> dealRummyNextRound : :: prevoiusRoundTableData :: roundTableData :: ", roundTableData);
        logger.info("------>> ------>> dealRummyNextRound : : :: tableData :: ", tableData);

        const nextRound = currentRound + NUMERICAL.ONE;

        await roundHistory(roundTableData, currentRound);

        logger.info("------>> dealRummyNextRound : :: tableData.currentRound :: ", tableData.currentRound);

        if (currentRound < tableData.dealType && roundTableData.totalPlayers > NUMERICAL.ONE) {
            logger.info("-------->> ------>> dealRummyNextRound : : ::  player are more than one so next round start :: ");

            // round table for next round
            await filterRoundTableForNextRound(tableId, currentRound, nextRound);
            const nextRoundData = await getRoundTableData(tableId, nextRound);
            logger.info("------->> ------>> dealRummyNextRound : : :: nextRoundData :: ", nextRoundData);

            // set Round in socket
            if (tableData.dealType !== currentRound && roundTableData.totalPlayers > NUMERICAL.ONE) {
                tableData.currentRound = nextRound;
                await setTableData(tableData);
                await setScoketData(roundTableData, tableId, nextRound)
            }

            const userIDs = await getPlayerIdForRoundTable(tableId, nextRound);
            logger.info("------>> ------>> dealRummyNextRound : : :: getPlayerIdForRoundTable :: ", userIDs);

            const dealerPlayer = await selectDealer(nextRoundData.tossWinnerPlayer, tableId, nextRound);
            logger.info("------>> ------>> dealRummyNextRound : : :: dealerPlayer :: ", dealerPlayer);

            nextRoundData.dealerPlayer = dealerPlayer;
            await setRoundTableData(tableId, nextRound, nextRoundData);
            await filterPlayerForNextRound(userIDs, tableId, currentRound);

            const eventGTIdata = await formatGameTableInfo(
                tableData,
                nextRoundData,
                nextRound
            );

            logger.info("------>> ------>> dealRummyNextRound : :: eventGTIdata :: ", eventGTIdata);

            commonEventEmitter.emit(EVENTS.JOIN_TABLE_SOCKET_EVENT, {
                tableId,
                data: {
                    selfPlayerData: {},
                    tableInfo: eventGTIdata
                }
            })

            // start next round
            await startRound({
                timer: 10,
                tableId,
                currentRound: nextRound
            });
        } else {
            logger.info("------>> ------>> dealRummyNextRound : : :: game winner declare :: ");
            const winnerPlayerUserIds: string[] = [];

            await cancelAllTimers(tableId, roundTableData.seats, true);

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);
                    console.log("------>> ------>> dealRummyNextRound : : :: playerData :: ", playerData)
                    if (playerData.isWinner) {
                        winnerPlayerUserIds.push(playerData.userId)
                    }
                }
            }

            logger.info("------>> ------>> dealRummyNextRound : : :: eventGTIdata :: ", winnerPlayerUserIds);

            const randomUserData = await getUser(winnerPlayerUserIds[NUMERICAL.ZERO]);
            logger.info("------>> ------>> dealRummyNextRound : : :: randomUserData :: ", randomUserData);

            const allPlayerDetails: formateScoreIf[] = [];
            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);
                    if (playerData) {
                        if (playerData.isWinner) {
                            if (winnerPlayerUserIds.length > NUMERICAL.ONE) {
                                let tiePrize: number | string = tableData.winPrice / winnerPlayerUserIds.length;
                                tiePrize = tiePrize.toFixed(2)
                                const obj: formateScoreIf = {
                                    userId: playerData.userId,
                                    winLossStatus: "Tie",
                                    winningAmount: tiePrize,
                                    score: playerData.gamePoints
                                }

                                allPlayerDetails.push(obj);
                            } else {
                                const obj: formateScoreIf = {
                                    userId: playerData.userId,
                                    winLossStatus: "Win",
                                    winningAmount: tableData.winPrice.toFixed(2),
                                    score: playerData.gamePoints
                                }
                                allPlayerDetails.push(obj);
                            }
                        } else {
                            const obj: formateScoreIf = {
                                userId: playerData.userId,
                                winLossStatus: "Loss",
                                winningAmount: String(NUMERICAL.ZERO),
                                score: playerData.gamePoints
                            }
                            allPlayerDetails.push(obj);
                        }

                        await markCompletedGameStatus({
                            tableId,
                            gameId: tableData.gameId,
                            tournamentId: tableData.lobbyId
                        },
                            randomUserData.authToken,
                            playerData.socketId
                        );
                    } else {
                        const obj: formateScoreIf = {
                            userId: roundTableData.seats[seat].userId,
                            winLossStatus: "Loss",
                            winningAmount: String(NUMERICAL.ZERO),
                            score: NUMERICAL.ZERO
                        }
                        allPlayerDetails.push(obj);
                    }
                }
            }

            // winner get data for client side api
            const apiData = await formatMultiPlayerScore(tableId, tableData.lobbyId, allPlayerDetails);
            logger.info("------>> ------>> dealRummyNextRound : : :: apiData :: ", apiData);

            // creadit amount for winner players
            await multiPlayerWinnScore(apiData, randomUserData.authToken);

            for await (const player of allPlayerDetails) {
                if (player.winLossStatus === "Win") {
                    const userData = await getUser(player.userId);
                    logger.info("------>> ------>> dealRummyNextRound : : :: Win Player :: ");
                    logger.info("------>> ------>> dealRummyNextRound : : :: userData :: ", userData);

                    userData.balance += tableData.winPrice;

                    await setUser(player.userId, userData)

                } else if (player.winLossStatus === "Tie") {
                    const userData = await getUser(player.userId);
                    logger.info("------>> ------>> dealRummyNextRound : : :: Tie Player :: ");
                    logger.info("------>> ------>> dealRummyNextRound : : :: userData :: ", userData);

                    userData.balance += tableData.winPrice;

                    await setUser(player.userId, userData)
                }
            }

            // for await (const userID of winnerPlayerUserIds) {
            //     const userData = await getUser(userID);
            //     userData.balance += tableData.winPrice / winnerPlayerUserIds.length
            //     userData.balance = Number(userData.balance.toFixed(NUMERICAL.TWO));
            //     await setUser(userID, userData)
            // }

            await removeTurnHistoy(tableId);
            await removeRoundTableHistory(tableId);
            await removeScoreBoardHistory(tableId);

            await newGameStart(tableId);
        }

    } catch (error) {
        logger.error(`---- ------>> dealRummyNextRound : :: ERROR :: `, error);
        throw error;
    }
}