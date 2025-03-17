import { ERROR_TYPE, EVENTS, MESSAGES, RUMMY_TYPES, SHUFFLE_CARDS, TABLE_STATE } from "../../../../constants";
import logger = require("../../../../logger");
import getPlayerIdForRoundTable = require("../../utils/getPlayerIdForRoundTable")
import shuffleCards = require("./shuffleCards");
import { NUMERICAL } from "../../../../constants";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players"
import commonEventEmitter = require("../../../commonEventEmitter");
import checkCardSequence = require("./checkCardSequence");
import countTotalPoints = require("../../utils/countTotalPoint");
import formatProvidCardInfo = require("../../formatResponse/formatProvidCardInfo");
import Errors from "../../../errors";
import { PLAYER_STATE } from "../../../../constants"
import { roundHistory } from "../History";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getLock } from "../../../lock";

async function distributeCards(
    tableId: string,
    round: number,
    lockKeys: string[]
): Promise<void> {
    logger.info("===================> distributeCards <<===================")
    const distributeCardLocks = await getLock().acquire([`locks:${tableId}`, ...lockKeys], 2000);
    try {

        const roundTableData = await getRoundTableData(tableId, round);
        logger.info("------>> distributeCards :: roundTableData :: ", roundTableData);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.START_ROUND_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        // playing Player IDS
        const userIds: string[] = await getPlayerIdForRoundTable(tableId, round);

        if (roundTableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {


            const cards: string[] = [...SHUFFLE_CARDS.DECK_ONE, ...SHUFFLE_CARDS.DECK_TWO, ...SHUFFLE_CARDS.JOKER];

            // shuffle cards
            const shuffCards: string[] = await shuffleCards(cards);

            logger.info("------->> distributeCards :: userIds :: ", userIds);

            let jokerCardIndex: number = Math.floor(Math.random() * shuffCards.length);

            let jokerCard: string = shuffCards[jokerCardIndex];

            logger.info("------>> distributeCards :: jokerCard :: ", jokerCard);

            if (jokerCard === 'J_J_J_1' || jokerCard === 'J_J_J_2') {
                jokerCard = "S_14_0_1"

                // find the joker index 
                jokerCardIndex = shuffCards.findIndex((card, index) => {
                    return card === jokerCard
                })
            }

            // remove trumpCard card
            shuffCards.splice(jokerCardIndex, NUMERICAL.ONE);

            // splitting card for which card 
            const jokerValue = jokerCard.split("_")[NUMERICAL.ONE]

            // set trumpCard card in close deck for that all card   
            let closeDeck: string[] = []

            for await (const ele of shuffCards) {
                const splitcard = ele.split("_");
                if (jokerValue === splitcard[NUMERICAL.ONE]) {
                    closeDeck.push(`${splitcard[NUMERICAL.ZERO]}_${splitcard[NUMERICAL.ONE]}_J_${splitcard[NUMERICAL.THREE]}`)
                } else {
                    closeDeck.push(ele)
                }

            }
            logger.info("----->> distributeCards :: closeDeck :: ", closeDeck);

            // card distribution
            let userCards: Array<string[]> = [];

            for await (const userID of userIds) {

                let tempUsersCards: Array<string> = [];

                for (let j = NUMERICAL.ZERO; j < NUMERICAL.THIRTEEN; j++) {
                    const ran = Math.floor(Math.random() * closeDeck.length)
                    tempUsersCards.push(closeDeck[ran]);
                    closeDeck.splice(ran, NUMERICAL.ONE);
                }

                userCards.push(tempUsersCards);
                const player = await getPlayerGamePlay(userID, tableId);
                player.currentCards = [tempUsersCards];
                await setPlayerGamePlay(userID, tableId, player);

            }
            logger.info("----->> distributeCards :: userCards :: ", userCards);

            // pick one card for open deck
            const openDeckCardIndex = Math.floor(Math.random() * closeDeck.length);
            const openDeckCard = closeDeck[openDeckCardIndex];
            closeDeck.splice(openDeckCardIndex, NUMERICAL.ONE)
            logger.info("----->> distributeCards :: openDeckCard :: ", openDeckCard);

            roundTableData.trumpCard = jokerCard;
            roundTableData.closedDeck = closeDeck;
            roundTableData.opendDeck = [openDeckCard];

        }

        roundTableData.tableState = TABLE_STATE.PROVIDED_CARDS;
        roundTableData.firstTurn = true;

        await setRoundTableData(tableId, round, roundTableData);
        await roundHistory(roundTableData, round);

        logger.info("----->> distributeCards :: userIds :: ", userIds);

        for await (const userID of userIds) {

            const playerInfo = await getPlayerGamePlay(userID, tableId);
            logger.info("----->> distributeCards :: playerInfo :: ", playerInfo);
            const playerCards = playerInfo.currentCards;

            const cards = await checkCardSequence(playerCards, playerInfo, tableId);
            const totalPoint = await countTotalPoints(cards);

            logger.info("----->> distributeCards :: cards :: ", cards)
            logger.info("----->> distributeCards :: totalPoint :: ", totalPoint)

            playerInfo.cardPoints = totalPoint;
            playerInfo.playingStatus = PLAYER_STATE.CARD_DISTRIBUTION

            await setPlayerGamePlay(userID, tableId, playerInfo);
            const formatedProvidedCards = await formatProvidCardInfo(roundTableData.trumpCard, totalPoint, cards, roundTableData.opendDeck[NUMERICAL.ZERO])

            logger.info("----->> distributeCards :: formatProvidCardInfo :: ", formatProvidCardInfo);

            commonEventEmitter.emit(EVENTS.PROVIDED_CARDS_SOCKET_EVENT, {
                socket: playerInfo.socketId,
                data: formatedProvidedCards
            });

        }
    } catch (error: any) {
        logger.error("distributeCards :: ERROR ::", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error)
        } else {
            throw new Errors.DistributeCardsError(error)
        }
    } finally {
        await getLock().release(distributeCardLocks);
        logger.info(`---- distributeCardLocks :: Lock Released`)
    }
}


export = distributeCards;