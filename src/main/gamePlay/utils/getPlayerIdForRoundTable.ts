import { NUMERICAL, PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import { roundTableIf } from "../../interfaces/roundTableIf";
import { getRoundTableData } from "../cache/Rounds";
import { getTableData } from "../cache/Tables";
const _ = require("underscore")

async function getPlayerIdForRoundTable(
    tableId: string,
    currentRound: number
): Promise<string[]> {
    logger.info("--------->> getPlayerIdForRoundTable <<----------")
    try {
        let roundTableData: roundTableIf = await getRoundTableData(tableId, currentRound);

        const playingUsers = []
        for await (const ele of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[ele]).length > NUMERICAL.ONE) {
                if (roundTableData.seats[ele].userStatus === PLAYER_STATE.PLAYING) {
                    playingUsers.push(roundTableData.seats[ele].userId)
                }
            }
        }

        const userIds: string[] = _.compact(playingUsers);
        logger.info("----->> getPlayerIdForRoundTable :: userIds: ", userIds)

        return userIds;

    } catch (error) {
        logger.error("getPlayerIdForRoundTable", error)
        throw error;
    }
}


export = getPlayerIdForRoundTable;