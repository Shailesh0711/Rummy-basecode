import logger from "../../../../logger";
import config from "../../../../connections/config";
import { getTableData } from "../../cache/Tables";
import { NUMERICAL, PLAYER_STATE, RUMMY_TYPES } from "../../../../constants";
import { poolRummyScoreBoard } from "./rummyScoreBoards/poolRummyScoreBoard";
import { dealRummyScoreBoard } from "./rummyScoreBoards/dealRummyScoreBoard";
import { pointRummyScoreBoard } from "./rummyScoreBoards/pointRummyScoreBoard";
import { getRoundTableData } from "../../cache/Rounds";
import { getLock } from "../../../lock";

async function ScoreBoard(
    tableId: string,
    currentRound: number,
    isNextRound: boolean,
    allDeclared: boolean,
    userID?: string,
): Promise<void> {
    logger.info("========================>> ScoreBoard <<============================");
    const { NEW_GAME_START_TIMER, SCORE_BOARD_TIMER, REMAIN_PLAYERS_FINISH_TIMER, SPLIT_AMOUNT_TIMER } = config();
    try {
        logger.info("----->> ScoreBoard :: tableId: ", tableId);
        logger.info("----->> ScoreBoard :: currentRound: ", currentRound);
        logger.info("----->> ScoreBoard :: isNextRound: ", isNextRound);
        logger.info("----->> ScoreBoard :: allDeclared: ", allDeclared);
        logger.info("----->> ScoreBoard :: userID :: 1 :: ", userID ? userID : "");

        const tableData = await getTableData(tableId);
        logger.info("----->> ScoreBoard :: tableData: ", tableData);

        logger.info("----->> ScoreBoard :: RUMMY_TYPE :: ", tableData.rummyType);
        const userId = userID ? userID : null;
        logger.info("----->> ScoreBoard :: userId :: 2 :: ", userId);
        const lockKeys: string[] = [];

        if (userId) {
            lockKeys.push(`locks:${userId}`)
        } else {
            const roundTableData = await getRoundTableData(tableId, currentRound);
            logger.info("----->> ScoreBoard :: roundTableData ::  ", roundTableData);

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    if (
                        roundTableData.seats[seat].userStatus !== PLAYER_STATE.LEFT &&
                        roundTableData.seats[seat].userStatus !== PLAYER_STATE.LOST &&
                        roundTableData.seats[seat].inGame
                    ) {
                        lockKeys.push(`locks:${roundTableData.seats[seat].userId}`)
                    }
                }
            }
        }
        logger.info("----->> ScoreBoard :: lockKeys ::  ", lockKeys);

        let scoreBoardLock = await getLock().acquire([...lockKeys], 2000);
        try {

            switch (tableData.rummyType) {

                case RUMMY_TYPES.POOL_RUMMY:
                    await poolRummyScoreBoard(tableId, currentRound, isNextRound, allDeclared, userId)
                    break;

                case RUMMY_TYPES.DEALS_RUMMY:
                    await dealRummyScoreBoard(tableId, currentRound, isNextRound, allDeclared, userId)
                    break;

                case RUMMY_TYPES.POINT_RUMMY:
                    await pointRummyScoreBoard(tableId, currentRound, isNextRound, allDeclared, userId)
                    break;

                default:
                    logger.info("<<====== Default :: ScoreBoard :: Call ========>>");
                    break;
            }

        } catch (error) {
            console.log(" ===== ScoreBoard ::  ERROR :: ", error);
            logger.error(" ===== ScoreBoard ::  ERROR :: ", error);
        } finally {
            if (scoreBoardLock) {
                await getLock().release(scoreBoardLock);
                logger.info("---- ScoreBoard :: LOCK RELEASE ----");
            }
        }

    } catch (error) {
        console.log("---ScoreBoard :: ERROR ---", error)
        logger.error("---ScoreBoard :: ERROR ---", error);
        throw error;
    }
}

export = ScoreBoard;