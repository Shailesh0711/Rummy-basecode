import { NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";

const _ = require("underscore");

function shuffleCards(
    Cards: string[]
): string[] {
    logger.info("---------->> shuffleCards <<--------------")
    try {
        const cards = _.clone(Cards);
        const shuffle: string[] = [];
        while (cards.length > NUMERICAL.ZERO) {
            const rt = Math.floor(Math.random() * cards.length);
            shuffle.push(cards[rt]);
            cards.splice(rt, NUMERICAL.ONE);
        }
        return shuffle;
    } catch (error) {
        logger.error("--- shuffleCards :: ERROR ::", error);
        throw error;
    }
}

export = shuffleCards;