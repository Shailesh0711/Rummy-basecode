import { NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";



async function setCardSuitWise(
    card: string[]
): Promise<string[][]> {
    logger.info("------------>> setCardSuitWise <<--------------")
    try {
        card.sort((f: any, e: any) => {
            const a = f.split('_')[NUMERICAL.ONE] === `${NUMERICAL.FOURTEEN}` ? `${NUMERICAL.ONE}` : f.split('_')[NUMERICAL.ONE];
            const b = e.split('_')[NUMERICAL.ONE] === `${NUMERICAL.FOURTEEN}` ? `${NUMERICAL.ONE}` : e.split('_')[NUMERICAL.ONE];
            return a - b;
        });
        logger.info('setCardSuitWise : card setCardSuitWise : 1 ::', card);
        const hearts: string[] = [];
        const clubs: string[] = [];
        const diamond: string[] = [];
        const spades: string[] = [];
        const joker: string[] = [];

        card.forEach((userCard: string, index: any) => {
            const rang = userCard.split('_')[NUMERICAL.ZERO];
            if (rang === 'H') {
                hearts.push(userCard);
            } else if (rang === 'C') {
                clubs.push(userCard);
            } else if (rang === 'D') {
                diamond.push(userCard);
            } else if (rang === 'S') {
                spades.push(userCard);
            } else if (rang === "J") {
                joker.push(userCard);
            }
        });

        const uCard = [hearts, clubs, diamond, spades, joker];

        const uCards = uCard.filter((ele) => {
            if (ele.length > NUMERICAL.ZERO) return ele;
        })
        logger.info('---->> setCardSuitWise : uCards ::', uCards);
        return uCards;

    } catch (error) {
        console.log(error);
        logger.error("---setCardSuitWise :: ERROR :: ", error);;
        throw error;
    }
}

export = setCardSuitWise;