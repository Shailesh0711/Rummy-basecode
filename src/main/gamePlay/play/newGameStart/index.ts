import config from "../../../../connections/config";
import { EVENTS, MESSAGES, NUMERICAL, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getUser, setUser } from "../../cache/User";
import formatRoundstartInfo from "../../formatResponse/formatRoundstartInfo";
import { rePlayerTable } from "./helper/rePlayerTable";
import { reRoundTable } from "./helper/reRoundTable";
import { reTableConfig } from "./helper/reTableConfig";
import { setNewGameSocketData } from "./helper/setNewGameSocketData";
import Scheduler from "../../../scheduler"
import timeDifference from "../../../common/timeDiff";
import formatWaitingPlayersInfo from "../../formatResponse/formatWaitingPlayersInfo";
import { setQueue } from "../../utils/manageQueue";
import { getTableData, removeTableData, setTableData } from "../../cache/Tables";
import { addGameRunningStatus } from "../../../clientsideapi/addGameRunningStatus";
import { joinRoomSocketId } from "../../../socket";


export async function newGameStart(
    oldTableId: string,
) {
    const { TOTAL_GAME_START_TIMER, GAME_START_TIMER, WAITING_FOR_PLAYER } = config();
    logger.info(`------------------>> newGameStart <<------------------`)
    try {

        // create new table config
        const { dealType, newTableId, totalPlayers, totalRounds, gameId, lobbyId, gameType, currentRound, minPlayerForPlay } = await reTableConfig(oldTableId);
        logger.info(`------>> newGameStart :: oldTableId :: `, oldTableId);
        logger.info(`------>> newGameStart :: newTableId :: `, newTableId);

        const queueKey = `${gameType}:${gameId}:${lobbyId}`

        logger.info(`------>> newGameStart :: queueKey :: `, queueKey);

        const connectedSocketIds: string[] = await joinRoomSocketId(oldTableId);

        logger.info(`------>> newGameStart :: connectedSocketIds :: `, connectedSocketIds);


        // create new round table
        const { newRoundTableData, isNewGame } = await reRoundTable(
            oldTableId,
            newTableId,
            dealType,
            totalPlayers,
            totalRounds,
            gameId,
            lobbyId,
            currentRound,
            connectedSocketIds,
            minPlayerForPlay
        );

        logger.info(`------>> newGameStart :: newRoundTableData :: `, newRoundTableData)

        if (isNewGame) {

            // re-set player playing table
            await rePlayerTable(newTableId, gameId, lobbyId, newRoundTableData);

            // set socket metadata
            const isSetSocketData = await setNewGameSocketData(
                newTableId,
                oldTableId,
                dealType,
                newRoundTableData
            );

            // set lobby id
            let PlayerCount = NUMERICAL.ZERO;
            for await (const seat of Object.keys(newRoundTableData.seats)) {
                if (Object.keys(newRoundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    const userData = await getUser(newRoundTableData.seats[seat].userId);
                    userData.OldLobbyId = lobbyId;
                    await setUser(newRoundTableData.seats[seat].userId, userData);
                    logger.info('------>> newGameStart :: userData ::', userData);

                    await addGameRunningStatus(
                        {
                            tableId: newTableId,
                            tournamentId: lobbyId,
                            gameId,
                        },
                        userData.authToken,
                        userData.socketId,
                        userData.socketId
                    )
                    PlayerCount += NUMERICAL.ONE;
                }
            }


            if (isSetSocketData) {

                const tableData = await getTableData(newTableId);
                logger.info(`------>> newGameStart :: tableData :: `, tableData);

                tableData.winPrice = (tableData.bootAmount * PlayerCount) * (NUMERICAL.ONE - (tableData.rake / 100));
                await setTableData(tableData);

                commonEventEmitter.emit(EVENTS.NEW_GAME_START_SOCKET_EVENT, {
                    tableId: newTableId,
                    data: {
                        oldTableId: oldTableId,
                        newTableId: newTableId,
                        isNewGameStart: true
                    }
                })

                if (newRoundTableData.totalPlayers < minPlayerForPlay) {

                    await setQueue(queueKey, newTableId);

                    const newGetRoundData = await getRoundTableData(newTableId, NUMERICAL.ONE)

                    newGetRoundData.tableState = TABLE_STATE.WAIT_FOR_PLAYER;
                    await setRoundTableData(newTableId, NUMERICAL.ONE, newGetRoundData);

                } else if (newRoundTableData.totalPlayers === totalPlayers) {

                    // set lobby id
                    for await (const seat of Object.keys(newRoundTableData.seats)) {
                        if (Object.keys(newRoundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                            const userData = await getUser(newRoundTableData.seats[seat].userId);
                            userData.OldLobbyId = lobbyId;
                            await setUser(newRoundTableData.seats[seat].userId, userData);
                            logger.info('------>> newGameStart :: userData ::', userData);

                            await addGameRunningStatus(
                                {
                                    tableId: newTableId,
                                    tournamentId: lobbyId,
                                    gameId,
                                },
                                userData.authToken,
                                userData.socketId,
                                userData.socketId
                            )

                        }
                    }

                    const newGetRoundData = await getRoundTableData(newTableId, NUMERICAL.ONE)

                    newGetRoundData.tableState = TABLE_STATE.ROUND_TIMER_STARTED;
                    newGetRoundData.updatedAt = new Date();

                    await setRoundTableData(newTableId, NUMERICAL.ONE, newGetRoundData);
                    
                    logger.info(`------>> newGameStart :: newRound :: `,)

                    await Scheduler.addJob.InitializeGameplay({
                        timer: GAME_START_TIMER * NUMERICAL.THOUSAND,
                        tableId: newTableId,
                        queueKey,
                        currentRound: NUMERICAL.ONE
                    });

                } else if (minPlayerForPlay <= newRoundTableData.totalPlayers) {

                    // set lobby id
                    for await (const seat of Object.keys(newRoundTableData.seats)) {
                        if (Object.keys(newRoundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                            const userData = await getUser(newRoundTableData.seats[seat].userId);
                            userData.OldLobbyId = lobbyId;
                            await setUser(newRoundTableData.seats[seat].userId, userData);
                            logger.info('------>> newGameStart :: userData ::', userData);

                            await addGameRunningStatus(
                                {
                                    tableId: newTableId,
                                    tournamentId: lobbyId,
                                    gameId,
                                },
                                userData.authToken,
                                userData.socketId,
                                userData.socketId
                            )

                        }
                    }

                    await setQueue(queueKey, newTableId);

                    const newGetRoundData = await getRoundTableData(newTableId, NUMERICAL.ONE)

                    newGetRoundData.updatedAt = new Date();
                    newGetRoundData.tableState = TABLE_STATE.WAITING_FOR_PLAYERS;

                    await setRoundTableData(newTableId, NUMERICAL.ONE, newGetRoundData);

                    await Scheduler.addJob.WaitingForPlayer({
                        timer: WAITING_FOR_PLAYER * NUMERICAL.THOUSAND,
                        tableId: newTableId,
                        queueKey,
                        currentRound: NUMERICAL.ONE,
                        lobbyId
                    });
                }
            }

        } else {
            logger.warn(`----->> newGameStart  :: isNewGame :: ${isNewGame}`);
            await removeTableData(newTableId);
        }

    } catch (error) {
        logger.info(`--- newGameStart :: ERROR :: `, error);
        throw error;
    }
}