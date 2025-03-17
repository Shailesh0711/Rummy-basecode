import { NUMERICAL } from "../../../constants"
import logger from "../../../logger"
import { cards } from "../../interfaces/cards"


async function countTotalPoints(
    cards: cards[],
    poolTtype?: number
): Promise<number> {
    try {

        if (cards.length > NUMERICAL.ZERO) {

            const pointsArr = cards.map((card: any) => {
                return card.cardPoints
            })
            const totalPoints: number = await pointsArr.reduce((a: any, b: any) => {
                return a + b
            })

            if (poolTtype) {
                if (poolTtype === NUMERICAL.SIXTY_ONE) {
                    if (totalPoints > 61) return 60
                } else {
                    if (totalPoints > 80) return 80
                }
            }
            if (totalPoints > 80) return 80

            return totalPoints
        } else {
            return NUMERICAL.ZERO
        }
    } catch (error) {
        logger.error("countTotalPoints :: ERROR", error);
        throw error;
    }
}


export = countTotalPoints