import logger from "../../../logger";


async function countUserCards(
    cards: string[][]
): Promise<number> {
    logger.info("-------------->> countUserCards <<-------------")
    try {
        let totalCards = 0;

        cards.map((card) => {
            totalCards += card.length
        });
        logger.info("----->> countUserCards :: totalCards: ", totalCards)
        return totalCards;
    } catch (error) {
        logger.error("---countUserCards :: ERROR :: ", error);
        throw error;
    }
}

export = countUserCards;