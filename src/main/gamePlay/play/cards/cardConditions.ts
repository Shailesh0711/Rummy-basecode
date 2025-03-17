import { NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
const _ = require("underscore")


function sort(
    cards: number[],
    joker?: number
): number[] {
    try {
        const card: number[] = _.clone(cards);

        card.sort((f, e) => {
            return f - e;
        });

        let sordcardNumber = []
        for (const ele of card) {
            if (ele === NUMERICAL.FOURTEEN && card[NUMERICAL.ZERO] === NUMERICAL.TWO) {
                sordcardNumber.push(NUMERICAL.ONE);
            } else if (ele === NUMERICAL.FOURTEEN && joker) {
                let count: number = NUMERICAL.ZERO
                for (let i = NUMERICAL.ONE; i <= joker; i++) {
                    if (
                        card[NUMERICAL.ZERO] === (NUMERICAL.TWO + i)
                    ) {
                        if (count === NUMERICAL.ZERO) {
                            sordcardNumber.push(NUMERICAL.ONE)
                        }
                        count += NUMERICAL.ONE;
                    }
                }

                if (count === NUMERICAL.ZERO) {
                    sordcardNumber.push(ele)
                }
            } else {
                sordcardNumber.push(ele);
            }
        }

        if (sordcardNumber.includes(NUMERICAL.ONE)) {
            sordcardNumber.sort((f, e) => {
                return f - e;
            });
        }
        return sordcardNumber;

    } catch (error) {
        logger.error("---sort :: ERROR :: ", error);
        throw error;
    }
}


function isPure(card: string[]): boolean {
    try {
        let suitOfCard: string[] = [];
        let cardNumber: number[] = [];
        let isJoker: Array<number | string> = [];
        let deckNo: number[] = [];

        card.map((ele, ind) => {
            let arr = ele.split('_');
            suitOfCard.push(arr[NUMERICAL.ZERO]);
            cardNumber.push(Number(arr[NUMERICAL.ONE]));
            isJoker.push(arr[NUMERICAL.TWO]);
            deckNo.push(Number(arr[NUMERICAL.THREE]));
        })

        const allEqual = isJoker.every(val => val == NUMERICAL.ZERO);
        const cardLatter = suitOfCard.every((val) => val === suitOfCard[NUMERICAL.ZERO])

        const sortCardNumber = sort(cardNumber)
        const res = sortCardNumber.map((ele, index) => {
            if ((cardNumber.length - NUMERICAL.ONE) !== index) {
                if ((ele + NUMERICAL.ONE) === sortCardNumber[index + NUMERICAL.ONE]) {
                    return true
                }
                else {
                    return false
                }
            }
        })

        if (card.length < NUMERICAL.THREE) return false
        if (!cardLatter) return false;
        if (res.includes(false)) return false;
        if (!allEqual) {
            if (cardLatter && !res.includes(false)) {
                return true;
            }
            return false;
        }

        return true;

    } catch (error) {
        logger.error("----isPure ::: ERROR :: ", error);
        throw error;
    }
}


async function isImpure(card: string[]): Promise<boolean> {
    try {
        let suitOfCard: string[] = [];
        let cardNumber: number[] = [];
        let jokerCard: string[] = [];
        let deckNo: any[] = [];

        for await (const ele of card) {
            let arr = ele.split('_');
            if (arr[NUMERICAL.TWO] === "J") {
                jokerCard.push(ele);
            } else {
                suitOfCard.push(arr[NUMERICAL.ZERO]);
                cardNumber.push(Number(arr[NUMERICAL.ONE]));
                deckNo.push(arr[NUMERICAL.THREE]);
            }
        }

        const cardLatter = suitOfCard.every((val) => val === suitOfCard[NUMERICAL.ZERO])

        const sortCardNumber = sort(cardNumber, jokerCard.length);
        let remainJoker = jokerCard.length;
        let index = NUMERICAL.ZERO;

        const res = [];

        for await (const ele of sortCardNumber) {
            if (cardNumber.length - NUMERICAL.ONE !== index) {
                if (ele === sortCardNumber[index + NUMERICAL.ONE]) {
                    res.push(false)
                } else if (ele + NUMERICAL.ONE === sortCardNumber[index + NUMERICAL.ONE]) {
                    res.push(true);
                } else {
                    if (remainJoker > NUMERICAL.ZERO) {
                        const diff = sortCardNumber[index + NUMERICAL.ONE] - ele;
                        const needJoker = diff - NUMERICAL.ONE;
                        if (needJoker <= remainJoker) {
                            remainJoker -= needJoker;
                            if (remainJoker < NUMERICAL.ZERO) {
                                res.push(false);
                            } else {
                                res.push(true);
                            }
                        } else {
                            res.push(false)
                        }
                    } else {
                        res.push(false);
                    }
                }
            }

            index += NUMERICAL.ONE;
        }

        if (card.length < NUMERICAL.THREE) return false;
        if (!cardLatter) return false;
        if (res.includes(false)) return false;

        return true

    } catch (error) {
        logger.error("---isImpure :: ERROR :: ", error)
        throw error;
    }
}

function isSet(card: string[]): boolean {
    try {
        let suitOfCard: string[] = [];
        let cardNumber: number[] = [];
        let jokerCard: string[] = [];
        let deckNo: number[] = [];

        let cCount = NUMERICAL.ZERO;
        let dCount = NUMERICAL.ZERO;
        let hCount = NUMERICAL.ZERO;
        let sCount = NUMERICAL.ZERO;

        if (card.length > NUMERICAL.FOUR) {
            return false;
        }

        card.map((ele, ind) => {
            let arr = ele.split('_');
            if (arr[NUMERICAL.TWO] === "J") {
                jokerCard.push(ele);
            } else {
                suitOfCard.push(arr[NUMERICAL.ZERO]);
                cardNumber.push(Number(arr[NUMERICAL.ONE]));
                deckNo.push(Number(arr[NUMERICAL.THREE]));
            }
        });

        const allEqual = cardNumber.every((val) => val === cardNumber[NUMERICAL.ZERO]);

        for (let i = NUMERICAL.ZERO; i < suitOfCard.length; i++) {
            if (suitOfCard[i] === "C") cCount++;
            if (suitOfCard[i] === "D") dCount++;
            if (suitOfCard[i] === "H") hCount++;
            if (suitOfCard[i] === "S") sCount++;
        }

        if (card.length < NUMERICAL.THREE) return false;
        if (!allEqual) return false

        if (cCount > NUMERICAL.ONE || dCount > NUMERICAL.ONE || hCount > NUMERICAL.ONE || sCount > NUMERICAL.ONE) {
            return false
        }

        return true

    } catch (error) {
        logger.error("---isSet :: ERROR ::", error);
        throw error;
    }
}

async function countCardsPoints(card: string[]): Promise<number> {
    try {

        const pointArr = card.map((ele) => {
            const cardPoint = ele.split("_")[NUMERICAL.ONE];
            const JokerPoint = ele.split("_")[NUMERICAL.TWO]
            if (cardPoint === "J" || JokerPoint === "J") {
                return NUMERICAL.ZERO;
            } else if (cardPoint === `${NUMERICAL.ELEVEN}` || cardPoint === `${NUMERICAL.TWELVE}` || cardPoint === `${NUMERICAL.THIRTEEN}` || cardPoint === `${NUMERICAL.FOURTEEN}`) {
                return NUMERICAL.TEN;
            }
            return Number(cardPoint);
        })
        const cardPoint = await pointArr.reduce((a, b) => {
            return a + b;
        })
        if (cardPoint > NUMERICAL.EIGHTEEN) return NUMERICAL.EIGHTEEN;
        return cardPoint;
    } catch (error) {
        logger.error("---countCardsPoints :: ERROR :: ", error);
        throw error;
    }
}


function wildCard(card: string[]): boolean {
    try {
        let jokerCard: string[] = [];

        card.map((ele, ind) => {
            let arr = ele.split('_');
            jokerCard.push(arr[NUMERICAL.TWO]);
        });

        const allEqual = jokerCard.every((val) => val === "J");

        if (allEqual) {
            return true;
        } else {
            return false;
        }

    } catch (error) {
        logger.error("---wildCard :: ERROR :: ", error);
        throw error;
    }
}

const exportObject = {
    isPure,
    isImpure,
    isSet,
    countCardsPoints,
    wildCard,
}

export = exportObject;