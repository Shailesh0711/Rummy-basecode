import { ERROR_TYPE, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import { setupRoundIf } from "../../../interfaces/startRoundIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { userIf } from "../../../interfaces/userSignUpIf";
import { getLock } from "../../../lock";
import { setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getTableData, setTableData } from "../../cache/Tables";
import { defaultPlayerGamePlayData, defaultTableData } from "../../defaultGenerator";
import defaultRoundTableData from "../../defaultGenerator/defaultRoundTableData";
import { getQueue } from "../../utils/manageQueue";

//find Table
export const findAvaiableTable = async (queueKey: string, oldTableId: string[]): Promise<string | null> => {
    const tableId: string | null = await getQueue(queueKey, oldTableId);
    return tableId;
};

// for creating new table
export const createTable = async (data: userIf): Promise<string> => {
    try {
        const tableData = defaultTableData(data);
        return setTableData(tableData);
    } catch (error) {
        logger.error('CATCH_ERROR : createTable :: insertPlayerInTable ::', data, error);
        throw error;
    }
};

export const setupRound = async ({ tableId, roundNo, totalPlayers, dealType, rummyType }: setupRoundIf): Promise<void> => {
    // create round one table
    try {
        const roundOneTableData = await defaultRoundTableData({
            tableId,
            totalPlayers,
            dealType,
            rummyType
        });

        await setRoundTableData(tableId, roundNo, roundOneTableData);
    } catch (error) {
        logger.error("---insertNewPlayer :: setupRound :: ERROR ::", error);
        throw error;
    }
};

// for creating and inserting playergameplay data
export const insertPlayerGamePlayData = async (
    userData: userIf,
    roundTableId: string,
    seatIndex: number,
): Promise<void> => {
    try {

        const playerGamePlayData: playerPlayingDataIf =
            defaultPlayerGamePlayData({
                roundTableId,
                seatIndex,
                ...userData,
            });

        await setPlayerGamePlay(
            userData.userId,
            playerGamePlayData.roundTableId,
            playerGamePlayData,
        );

    } catch (error) {
        logger.error("---insertNewPlayer :: insertPlayerGamePlayData :: ERROR ::", error);
        throw error;
    }
};

export const insertPlayerInTable = async (userData: userIf, tableId: string | null, queueKey: string, previoustableId: string[]): Promise<number> => {
    logger.info("---------->> insertPlayerInTable <<-------------");
    const TableLock = await getLock().acquire([`locks:${tableId}`], 2000);
    try {

        let tableConfig = await getTableData(tableId as string);

        if (!tableConfig) {

            tableId = await findAvaiableTable(queueKey, previoustableId)
            logger.info('---->> insertNewPlayer ::: before tableId ::: ', tableId);

            if (!tableId) {
                tableId = await createTable(userData);

                await setupRound({
                    tableId,
                    roundNo: NUMERICAL.ONE,
                    totalPlayers: userData.maximumSeat,
                    dealType: userData.dealType,
                    rummyType: userData.rummyType
                });
                tableConfig = await getTableData(tableId);
            }
        }

        tableId = tableId as string;

        let tableData = await getRoundTableData(tableId, tableConfig.currentRound);
        logger.info(`insertPlayerInTable :: tableConfig :: `, tableConfig);

        if (tableConfig === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.INSERT_NEW_PLAYER_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        logger.info(`insertPlayerInTable :: tableData :: `, tableData);
        if (tableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.INSERT_NEW_PLAYER_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        let seatIndex: number = -1;

        if (tableData != null) {

            for (let i = 0; i < tableData.maxPlayers; i++) {

                const key = `s${i}`;
                const seat = tableData.seats[`s${i}`];

                logger.info(
                    'add user Data in table : userData :: ',
                    userData,
                    'Object.keys(seat).length : userData :: ',
                    Object.keys(seat).length,
                );

                if (Object.keys(seat).length === NUMERICAL.ZERO) {
                    // inserting player in seat
                    tableData.seats[key]._id = userData._id;
                    tableData.seats[key].userId = userData.userId;
                    tableData.seats[key].username = userData.username;
                    tableData.seats[key].profilePicture = userData.profilePicture;
                    tableData.seats[key].seatIndex = i;
                    tableData.seats[key].userStatus = tableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || tableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || tableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ?
                        PLAYER_STATE.PLAYING : PLAYER_STATE.WATCHING;
                    tableData.seats[key].inGame = true;

                    tableData.totalPlayers += tableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || tableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || tableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ?
                        NUMERICAL.ONE : NUMERICAL.ZERO;
                    tableData.currentPlayer += tableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || tableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || tableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ?
                        NUMERICAL.ONE : NUMERICAL.ZERO;

                    seatIndex = i;

                    break;

                } else {

                    if (tableData.seats[key].userId === userData.userId) {
                        seatIndex = i;
                        break;
                    }

                }
            }
        }
        if (seatIndex != -1) {

            logger.info('add user Data in table : tableData :: ', tableData);

            let totalPlayersCount: number = NUMERICAL.ZERO;

            for await (const seat of Object.keys(tableData.seats)) {
                if (Object.keys(tableData.seats[seat]).length > NUMERICAL.ZERO) {
                    totalPlayersCount += NUMERICAL.ONE;
                }
            }

            if (NUMERICAL.TWO <= totalPlayersCount) {

                if (
                    tableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
                    tableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
                    tableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED
                ) {
                    tableData.tableState = TABLE_STATE.ROUND_TIMER_STARTED === tableData.tableState ? TABLE_STATE.ROUND_TIMER_STARTED : TABLE_STATE.WAITING_FOR_PLAYERS;
                }

            }

            await setRoundTableData(tableId, NUMERICAL.ONE, tableData);

            await insertPlayerGamePlayData(
                {
                    ...userData,
                    dealType: tableConfig.dealType,
                    gamePoolType: tableConfig.gamePoolType,
                    rummyType: tableConfig.rummyType,
                },
                tableId,
                seatIndex
            );
        }

        return seatIndex;

    } catch (error) {
        logger.error(
            'CATCH_ERROR : insertPlayerInTable :: ',
            error,
            "userId ::",
            userData.userId
        );
        throw error;
    } finally {
        await getLock().release(TableLock);
    }
};