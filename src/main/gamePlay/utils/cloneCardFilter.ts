import logger from "../../../logger";


async function cloneCardFilter(
    cards: string[]
): Promise<string[]> {
    const filteredCard: string[] = []
    try {
        for await (const card of cards) {
            let isCardVailable = false;
            for await (const filterCard of filteredCard) {
                if (filterCard === card) {
                    isCardVailable = true;
                }
            }

            if (!isCardVailable) {
                filteredCard.push(card);
            }
        }

        return filteredCard;
    } catch (error) {
        logger.info(`---- cloneCardFilter :: ERROR :: `, error);
        throw error;
    }
}

export = cloneCardFilter;