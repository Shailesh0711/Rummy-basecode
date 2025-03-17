import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { getRoundTableData } from "../../../cache/Rounds";


async function nextRoundUserIds(
    tableId: string,
    currentRound: number,
): Promise<string[]> {
    logger.info("----------------->> nextRoundUserIds <<------------")
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);

        const userIds: string[] = []

        for await (const keys of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[keys]).length > NUMERICAL.ONE) {
                if (
                    roundTableData.seats[keys].userStatus === PLAYER_STATE.PLAYING ||
                    roundTableData.seats[keys].userStatus === PLAYER_STATE.DROP_TABLE_ROUND ||
                    roundTableData.seats[keys].userStatus === PLAYER_STATE.WIN_ROUND ||
                    roundTableData.seats[keys].userStatus === PLAYER_STATE.WRONG_DECLARED ||
                    roundTableData.seats[keys].userStatus === PLAYER_STATE.DECLARED
                ) {
                    userIds.push(roundTableData.seats[keys].userId);
                }
            }
        }
        logger.info("------>> nextRoundUserIds :: userIds :: ", userIds);

        return userIds;
    } catch (error) {
        logger.error("---nextRoundUserIds :: ERROR: " + error)
        throw error;
    }
}

export = nextRoundUserIds;