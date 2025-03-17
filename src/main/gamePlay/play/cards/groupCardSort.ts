import { NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";



function groupCardSort(
    cards: string[]
): string[] {
    try {

        const jokerCards: string[] = [];
        const cardNumber: number[] = [];

        cards.map((card) => {
            const split = card.split("_");
            if (split[NUMERICAL.TWO] === "J") {
                jokerCards.push(card)
            }
            cardNumber.push(Number(split[NUMERICAL.ONE]))
        });

        const jokerLength = jokerCards.length;

        if (
            (jokerLength + cardNumber[NUMERICAL.ZERO]) >= cardNumber[NUMERICAL.ZERO]
        ) {
            cards.sort((f, e) => {
                const a: number = Number(f.split('_')[NUMERICAL.ONE] === `${NUMERICAL.FOURTEEN}` ? `${NUMERICAL.ONE}` : f.split('_')[NUMERICAL.ONE]);
                const b: number = Number(e.split('_')[NUMERICAL.ONE] === `${NUMERICAL.FOURTEEN}` ? `${NUMERICAL.ONE}` : e.split('_')[NUMERICAL.ONE]);
                return a - b;
            });
        } else {
            cards.sort((f, e) => {
                const a: number = Number(f.split('_')[NUMERICAL.ONE] === `${NUMERICAL.FOURTEEN}` ? `${NUMERICAL.FOURTEEN}` : f.split('_')[NUMERICAL.ONE]);
                const b: number = Number(e.split('_')[NUMERICAL.ONE] === `${NUMERICAL.FOURTEEN}` ? `${NUMERICAL.FOURTEEN}` : e.split('_')[NUMERICAL.ONE]);
                return a - b;
            });
        }

        return cards

    } catch (error) {
        logger.error("---groupCardSort :: ERROR :: ", error);
        throw error;
    }
}

export = groupCardSort;