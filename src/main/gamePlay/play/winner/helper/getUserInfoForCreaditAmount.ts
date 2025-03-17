import { NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { formateScoreIf } from "../../../../interfaces/clientApiIf";
import { userSeatsIf } from "../../../../interfaces/roundTableIf";
import { getPlayerGamePlay } from "../../../cache/Players";


export async function getUserInfoForCreaditAmount(
    tableId: string,
    winnerId: string,
    seats: userSeatsIf,
    winAmount: number
) {
    try {
        const allUserDetails: formateScoreIf[] = [];

        for await (const seat of Object.keys(seats)) {
            if (Object.keys(seats[seat]).length > NUMERICAL.ZERO) {
                const playerData = await getPlayerGamePlay(seats[seat].userId, tableId);
                if (playerData.userId === winnerId) {
                    const obj: formateScoreIf = {
                        userId: playerData.userId,
                        winningAmount: winAmount.toFixed(2),
                        winLossStatus: "Win",
                        score: playerData.gamePoints
                    }
                    allUserDetails.push(obj);
                } else {
                    const obj: formateScoreIf = {
                        userId: playerData.userId,
                        winningAmount: String(NUMERICAL.ZERO),
                        winLossStatus: "Loss",
                        score: playerData.gamePoints
                    }
                    allUserDetails.push(obj);
                }

            }
        }

        return allUserDetails;
    } catch (error) {
        logger.error(`----- getUserInfoForCreaditAmount :: ERROR :: `, error);
        throw error;
    }
}