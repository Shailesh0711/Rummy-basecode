import { EVENTS, NUMERICAL, PLAYER_STATE, REDIS } from "../../../../../constants";
import logger from "../../../../../logger";
import { markCompletedGameStatus } from "../../../../clientsideapi";
import commonEventEmitter from "../../../../commonEventEmitter";
import { playerInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { removeRejoinTableHistory } from "../../../cache/TableHistory";
import { getTableData, setTableData } from "../../../cache/Tables";
import { getUser } from "../../../cache/User";
import { decrCounterLobbyWise, getOnliPlayerCountLobbyWise, removeOnliPlayerCountLobbyWise } from "../../../cache/onlinePlayer";
import formatLeaveTableInfo from "../../../formatResponse/formatLeaveTableInfo";
import Scheduler from "../../../../scheduler";
import winner from "../../winner";
import { getLock } from "../../../../lock";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import nextRoundUserIds from "../helper/nextRoundUserIds";
import nextRoundPlayersInfo from "../helper/nextRoundPlayersInfo";
import { setScoketData } from "../helper/setSocketData";
import roundHistory from "../../History/roundHistory";
import filterRoundTableForNextRound from "../helper/filterRoundTableForNextRound";
import getPlayerIdForRoundTable from "../../../utils/getPlayerIdForRoundTable";
import selectDealer from "../../turn/selectDealer";
import filterPlayerForNextRound from "../helper/filterPlayerForNextRound";
import { formatGameTableInfo } from "../../../formatResponse";
import startRound from "../startRound";

async function points(
    poolType: number,
    gamePoints: number
): Promise<boolean> {
    logger.info("------------------->> point <<--------------------")
    try {
        if (poolType <= gamePoints) {
            return true
        }
        return false
    } catch (error) {
        logger.error("---points :: ERROR: " + error)
        throw error;
    }
}

async function checkPoint(
    tableId: string,
    currentRound: number,
    playersInfo: playerInfoIf[]
): Promise<void> {
    logger.info("------------------------>> checkPoints <<-------------------------")
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("---------->> checkPoints :: roundTableData :: ", roundTableData);
        logger.info("---------->> checkPoints :: playersInfo :: ", playersInfo);
        if (roundTableData.totalPlayers > NUMERICAL.ONE) {

            for await (const player of playersInfo) {
                const check = await points(player.poolType, player.gameScore);
                logger.info(
                    "------->> checkPoints :: check ::",
                    check,
                    `userId :: ${player.userId}`,
                    `tableId :: ${tableId}`,
                )
                if (check && player.Status !== PLAYER_STATE.LEFT && player.Status !== PLAYER_STATE.LOST) {
                    const tableData = await getTableData(tableId)
                    const { gameId, lobbyId } = tableData;
                    roundTableData.seats[`s${player.seatIndex}`].userStatus = PLAYER_STATE.LOST;
                    roundTableData.totalPlayers -= 1;
                    roundTableData.currentPlayer -= 1;

                    const playerData = await getPlayerGamePlay(player.userId, tableId)

                    playerData.userStatus = PLAYER_STATE.LOST;
                    playerData.playingStatus = PLAYER_STATE.LOST;

                    await setPlayerGamePlay(player.userId, tableId, playerData)
                    await setRoundTableData(tableId, currentRound, roundTableData);
                    await removeRejoinTableHistory(player.userId, gameId, lobbyId);
                    await Scheduler.cancelJob.LeaveTableTimerCancel(`${tableId}:${player.userId}`);

                    // for decrease online player in lobby
                    await decrCounterLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId);

                    // for if lobby active player is zero then remove key from redis
                    const lobbyWiseCounter = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId)
                    if (lobbyWiseCounter == NUMERICAL.ZERO) { await removeOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, lobbyId) };

                    let isLeaveBeforeLockIn = false;

                    const formatedRes = await formatLeaveTableInfo(
                        tableId,
                        player.userId,
                        player.seatIndex,
                        currentRound,
                        roundTableData.tableState,
                        roundTableData.totalPlayers,
                        roundTableData.seats[`s${player.seatIndex}`].username,
                        tableData.winPrice,
                        isLeaveBeforeLockIn
                    )
                    logger.info("-------->> checkPoints :: formatLeaveTableInfo :: ", formatedRes);

                    commonEventEmitter.emit(EVENTS.LEAVE_TABLE, {
                        tableId,
                        socket: player.socketId,
                        data: formatedRes,
                    });

                    const userData = await getUser(player.userId)

                    await markCompletedGameStatus({
                        tableId,
                        gameId: gameId,
                        tournamentId: lobbyId
                    },
                        userData.authToken,
                        playerData.socketId
                    );
                }
            }
        } else {
            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                    if (roundTableData.seats[seat].userStatus === PLAYER_STATE.DROP_TABLE_ROUND && roundTableData.seats[seat].inGame) {
                        roundTableData.seats[seat].userStatus = PLAYER_STATE.WIN_ROUND
                    }
                }
            }
            await setRoundTableData(tableId, currentRound, roundTableData)
        }
    } catch (error) {
        logger.error("---checkPoint :: ERROR: " + error);
        throw error;
    }
}

export async function poolRummyNextRound(
    tableData: playingTableIf,
    currentRound: number
) {
    try {
        const nextRound = currentRound + NUMERICAL.ONE;

        tableData.currentRound = nextRound;

        const { _id: tableId } = tableData;

        const userIds: string[] = await nextRoundUserIds(tableId, currentRound);
        logger.info("--------->> poolRummyNextRound nextRoundPlayersInfo :: ", userIds);

        let playersInfo: playerInfoIf[] = await nextRoundPlayersInfo(userIds, tableId);
        logger.info("--------->> poolRummyNextRound playersInfo ", playersInfo);

        await checkPoint(tableId, currentRound, playersInfo);

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("---->> poolRummyNextRound prevoiusRoundTableData :: roundTableData :: ", roundTableData);

        // set Round in socket
        await setScoketData(roundTableData, tableId, nextRound)

        await roundHistory(roundTableData, currentRound);

        if (roundTableData.totalPlayers > NUMERICAL.ONE) {
            logger.info("--------->> poolRummyNextRound :: player are more than one so next round start :: ");
            const lockKeys: string[] = []
            for await (const userID of userIds) {
                lockKeys.push(`locks:${userID}`)
            }

            let nextRoundlock = await getLock().acquire([...lockKeys], 2000);
            try {

                // round table for next round
                await filterRoundTableForNextRound(tableId, currentRound, nextRound);
                await setTableData(tableData);
                const nextRoundData = await getRoundTableData(tableId, nextRound);
                logger.info("-------->> poolRummyNextRound nextRoundData :: ", nextRoundData);

                const userIDs = await getPlayerIdForRoundTable(tableId, nextRound);
                logger.info("---------->> poolRummyNextRound getPlayerIdForRoundTable :: ", userIDs);

                const dealerPlayer = await selectDealer(nextRoundData.tossWinnerPlayer, tableId, nextRound);
                logger.info("---------->> poolRummyNextRound dealerPlayer :: ", dealerPlayer);

                nextRoundData.dealerPlayer = dealerPlayer;
                await setRoundTableData(tableId, nextRound, nextRoundData);
                await filterPlayerForNextRound(userIDs, tableId, currentRound);

                const eventGTIdata = await formatGameTableInfo(
                    tableData,
                    nextRoundData,
                    nextRound
                );

                logger.info("---------->> poolRummyNextRound eventGTIdata :: ", eventGTIdata);

                commonEventEmitter.emit(EVENTS.JOIN_TABLE_SOCKET_EVENT, {
                    tableId,
                    data: {
                        selfPlayerData: {},
                        tableInfo: eventGTIdata
                    }
                })

                if (nextRoundlock) {
                    await getLock().release(nextRoundlock);
                }

                // start next round
                await startRound({
                    timer: 10,
                    tableId,
                    currentRound: nextRound
                });
            } catch (error) {
                logger.error("--- poolRummyNextRound next round :: ERROR :: ", error);
            }

        } else {
            logger.info("---->> poolRummyNextRound game winner declare :: ");

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                    if (
                        (roundTableData.seats[seat].userStatus === PLAYER_STATE.WIN_ROUND ||
                            roundTableData.seats[seat].userStatus === PLAYER_STATE.DROP_TABLE_ROUND) ||
                        (roundTableData.seats[seat].userStatus !== PLAYER_STATE.LOST &&
                            roundTableData.seats[seat].userStatus !== PLAYER_STATE.LEFT) &&
                        roundTableData.seats[seat].inGame
                    ) {
                        logger.info("------>> poolRummyNextRound game winner userId :: ", roundTableData.seats[seat].userId);
                        const { lobbyId, gameId } = tableData;
                        const lockKeys: string[] = [];

                        for await (const userID of userIds) {
                            lockKeys.push(`locks:${userID}`)
                            await removeRejoinTableHistory(userID, gameId, lobbyId);
                        }

                        let winnerFuctionlock = await getLock().acquire([...lockKeys], 2000);
                        try {
                            await winner(
                                tableId,
                                roundTableData,
                                currentRound,
                                lobbyId,
                                gameId,
                                roundTableData.seats[seat].userId,
                                roundTableData.seats[seat].seatIndex,
                            );

                            if (winnerFuctionlock) {
                                await getLock().release(winnerFuctionlock);
                                winnerFuctionlock = null;
                            }
                        } catch (error) {
                            logger.error(`--- winner :: Fuction :: Lock :: ERROR ::`, error)
                        } finally {
                            if (winnerFuctionlock) {
                                await getLock().release(winnerFuctionlock);
                            }
                        }
                    }
                }
            }
        }

    } catch (error) {
        logger.error(`---- poolRummyNextRound :: ERROR :: `, error);
        throw error;
    }
}