import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { userSeatsIf } from "../../../../interfaces/roundTableIf";



async function getPlayersIds(
    seats: userSeatsIf
): Promise<string[]> {
    try {
        const userIds: string[] = [];
        Object.keys(seats).map((key) => {
            if (Object.keys(seats[key]).length > NUMERICAL.ONE) {
                if (
                    seats[key].userState !== PLAYER_STATE.LEFT &&
                    seats[key].userState !== PLAYER_STATE.LOST
                ) {
                    userIds.push(seats[key].userId)
                }
            }
        })
        return userIds;
    } catch (error) {
        logger.info("---- getPlayersIds :: ERROR :: ", error);
        throw error;
    }
}

const exportObject = {
    getPlayersIds,
}

export = exportObject;