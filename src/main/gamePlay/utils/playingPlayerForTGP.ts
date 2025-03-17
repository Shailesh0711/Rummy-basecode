import { NUMERICAL, PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import { roundTableIf } from "../../interfaces/roundTableIf";


export async function playingPlayerForTGP(
    roundTableData: roundTableIf
) {
    try {
        logger.info(`------------------->> playingPlayerForTGP <<-------------------------`);

        let count: number = NUMERICAL.ZERO
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                if (roundTableData.seats[seat].userStatus === PLAYER_STATE.PLAYING) {
                    count += NUMERICAL.ONE;
                }
            }
        }

        return count;
    } catch (error) {
        logger.error(`--- playingPlayerForTGP :: ERROR :: `, error);
        throw error;
    }
}