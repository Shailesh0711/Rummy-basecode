import config from "../../../../connections/config";
import { CARDS_STATUS, NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import { cards } from "../../../interfaces/cards";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import { setPlayerGamePlay } from "../../cache/Players";
import { setRoundTableData } from "../../cache/Rounds";
import { getTableData } from "../../cache/Tables";
import countTotalPoints from "../../utils/countTotalPoint";
import autoMakeGroup from "./autoDefaultMakeGroup";
import { countCardsPoints, isImpure, isPure, isSet, wildCard } from "./cardConditions";


async function checkCardSequence(
    currentCard: Array<Array<string>>,
    playerGamePlay: playerPlayingDataIf,
    tableId: string
): Promise<cards[]> {
    logger.info("---------------->> checkCardSequence <<---------------------")
    try {
        let cards: Array<cards> = [];

        logger.info("------>> checkCardSequence :: Before : currentCard :: ", currentCard);
        let isGroupMakes = await autoMakeGroup(currentCard, playerGamePlay.socketId);
        logger.info("------>> checkCardSequence :: :: isGroupMakes :: ", isGroupMakes);
        let newGroupCardsArr: any = (typeof isGroupMakes == "boolean") ? currentCard : isGroupMakes;

        for await (const cardArray of newGroupCardsArr) {
            let PURE = isPure(cardArray)
            if (!PURE) {
                let WILDCARDS = wildCard(cardArray)
                if (!WILDCARDS) {
                    let IMPURE = await isImpure(cardArray)
                    if (!IMPURE) {
                        let SET = isSet(cardArray)
                        if (!SET) {
                            const point = await countCardsPoints(cardArray);
                            cards.push({ group: cardArray, groupType: CARDS_STATUS.INVALID, cardPoints: point })
                        }
                        else {
                            const point = await countCardsPoints(cardArray);
                            cards.push({ group: cardArray, groupType: CARDS_STATUS.SET, cardPoints: point })
                        }
                    }
                    else {
                        const point = await countCardsPoints(cardArray);
                        cards.push({ group: cardArray, groupType: CARDS_STATUS.IMPURE, cardPoints: point })
                    }
                } else {
                    cards.push({ group: cardArray, groupType: CARDS_STATUS.WILD_CARDS, cardPoints: NUMERICAL.ZERO })
                }
            }
            else {
                cards.push({ group: cardArray, groupType: CARDS_STATUS.PURE, cardPoints: NUMERICAL.ZERO })
            }
        }

        let promise = await Promise.all(newGroupCardsArr);

        // cards sorting    
        let Invalid: Array<cards> = <cards[]>[];
        let Pure: Array<cards> = <cards[]>[];
        let Impure: Array<cards> = <cards[]>[];
        let Sets: Array<cards> = <cards[]>[];
        let Wild_Card: Array<cards> = <cards[]>[];

        for (let i = NUMERICAL.ZERO; i < cards.length; i++) {
            const element = cards[i];

            if (element.groupType == CARDS_STATUS.PURE) {
                Pure.push(element);
            }
            else if (element.groupType == CARDS_STATUS.IMPURE) {
                Impure.push(element);
            }
            else if (element.groupType == CARDS_STATUS.SET) {
                Sets.push(element);
            }
            else if (element.groupType == CARDS_STATUS.INVALID) {
                Invalid.push(element);
            }
            else if (element.groupType == CARDS_STATUS.WILD_CARDS) {
                Wild_Card.push(element);
            }
        }
        cards = [...Pure, ...Impure, ...Sets, ...Invalid, ...Wild_Card];

        promise = []
        for await (const cardsGroup of cards) {
            promise.push(cardsGroup.group)
        }

        logger.info("------------>> cards :: ", cards)
        logger.info("------------>> cards :: promise :: ", promise)


        let pureGroupTypeCount: number = NUMERICAL.ZERO;
        let imPureGroupTypeCount: number = NUMERICAL.ZERO;

        playerGamePlay.currentCards = promise
        playerGamePlay.groupingCards.pure = []
        playerGamePlay.groupingCards.impure = []
        playerGamePlay.groupingCards.set = []
        playerGamePlay.groupingCards.dwd = []
        playerGamePlay.groupingCards.wildCards = []

        for await (const ele of cards) {
            if (ele.groupType === CARDS_STATUS.PURE) {
                playerGamePlay.groupingCards.pure.push(ele.group)
                pureGroupTypeCount++;
            }
            if (ele.groupType === CARDS_STATUS.IMPURE) {
                playerGamePlay.groupingCards.impure.push(ele.group)
                imPureGroupTypeCount++;
            }
            if (ele.groupType === CARDS_STATUS.SET) {
                playerGamePlay.groupingCards.set.push(ele.group)
            }
            if (ele.groupType === CARDS_STATUS.INVALID) {
                playerGamePlay.groupingCards.dwd.push(ele.group)
            }
            if (ele.groupType === CARDS_STATUS.WILD_CARDS) {
                playerGamePlay.groupingCards.wildCards.push(ele.group)
            }
        }

        cards.filter((ele) => {
            if (pureGroupTypeCount > NUMERICAL.ZERO) {
                if (ele.groupType === CARDS_STATUS.IMPURE) {
                    return ele.cardPoints = NUMERICAL.ZERO;
                }
            }
            if (
                pureGroupTypeCount > NUMERICAL.ONE ||
                (imPureGroupTypeCount > NUMERICAL.ZERO && pureGroupTypeCount > NUMERICAL.ZERO)
            ) {
                if (ele.groupType === CARDS_STATUS.IMPURE) {
                    return ele.cardPoints = NUMERICAL.ZERO;
                }
                if (ele.groupType === CARDS_STATUS.SET) {
                    return ele.cardPoints = NUMERICAL.ZERO;
                }
            }
        })

        const totalPoint = await countTotalPoints(cards);

        playerGamePlay.cardPoints = totalPoint;

        await setPlayerGamePlay(playerGamePlay.userId, tableId, playerGamePlay);
        return cards;

    } catch (error) {
        logger.error("---checkCardSequence :: ERROR ::", error);
        throw error;
    }
}

export = checkCardSequence;