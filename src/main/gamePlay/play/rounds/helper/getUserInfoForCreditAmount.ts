import { NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { formateScoreIf } from "../../../../interfaces/clientApiIf";
import { userSeatsIf } from "../../../../interfaces/roundTableIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getUser } from "../../../cache/User";


export async function getUserInfoForCreditAmount(
    tableId: string,
    winnerId: string,
    seats: userSeatsIf,
    bootAmount: number,
): Promise<formateScoreIf[]> {
    try {
        const allUserDetails: formateScoreIf[] = [];
        let winPoints: number = NUMERICAL.ZERO;

        for await (const seat of Object.keys(seats)) {
            if (Object.keys(seats[seat]).length > NUMERICAL.ZERO) {

                const player = await getPlayerGamePlay(seats[seat].userId, tableId);
                logger.info("------->> getUserInfoForCreditAmount :: player :: ", player);

                const userData = await getUser(seats[seat].userId)
                logger.info("------->> getUserInfoForCreditAmount :: userData :: ", userData);

                if (seats[seat].userId !== winnerId) {

                    logger.info("------->> getUserInfoForCreditAmount :: player :: cardPoints :: ", player.cardPoints);

                    winPoints += player.cardPoints;
                }

            }
        }

        const winAmount = (winPoints + NUMERICAL.EIGHTEEN) * bootAmount;

        for await (const seat of Object.keys(seats)) {
            if (Object.keys(seats[seat]).length > NUMERICAL.ZERO) {
                const playerData = await getPlayerGamePlay(seats[seat].userId, tableId);
                if (playerData.userId === winnerId) {
                    const obj: formateScoreIf = {
                        userId: playerData.userId,
                        winningAmount: winAmount.toFixed(2),
                        winLossStatus: "Win",
                        score: playerData.cardPoints
                    }
                    allUserDetails.push(obj);
                } else {
                    const scoreDiff = NUMERICAL.EIGHTEEN - playerData.cardPoints;
                    logger.info("------->> getUserInfoForCreditAmount :: scoreDiff :: ", scoreDiff);
                    const obj: formateScoreIf = {
                        userId: playerData.userId,
                        winningAmount: String((scoreDiff * bootAmount).toFixed(NUMERICAL.TWO)),
                        winLossStatus: "Loss",
                        score: playerData.cardPoints
                    }
                    allUserDetails.push(obj);
                }

            }
        }

        return allUserDetails;
    } catch (error) {
        logger.error(`----- getUserInfoForCreditAmount :: ERROR :: `, error);
        throw error;
    }
}