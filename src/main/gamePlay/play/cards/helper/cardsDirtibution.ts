import { ERROR_TYPE, MESSAGES, NUMERICAL, SHUFFLE_CARDS } from "../../../../../constants";
import logger from "../../../../../logger";
import { throwErrorIF } from "../../../../interfaces/throwError";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import getPlayerIdForRoundTable from "../../../utils/getPlayerIdForRoundTable";
import roundHistory from "../../History/roundHistory";
import shuffleCards from "../shuffleCards";

export async function cardsDirtibution(
    tableId: string,
    round: number
) {
    try {

        const roundTableData = await getRoundTableData(tableId, round);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.START_ROUND_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("------>> cardsDirtibution :: roundTableData :: ", roundTableData);

        // playing Player IDS
        const userIds: string[] = await getPlayerIdForRoundTable(tableId, round);

        const cards: string[] = [...SHUFFLE_CARDS.DECK_ONE, ...SHUFFLE_CARDS.DECK_TWO, ...SHUFFLE_CARDS.JOKER];

        // shuffle cards
        const shuffCards: string[] = await shuffleCards(cards);

        logger.info("------->> cardsDirtibution :: userIds :: ", userIds);

        let jokerCardIndex: number = Math.floor(Math.random() * shuffCards.length);

        let jokerCard: string = shuffCards[jokerCardIndex];

        logger.info("------>> cardsDirtibution :: jokerCard :: ", jokerCard);

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
        logger.info("----->> cardsDirtibution :: closeDeck :: ", closeDeck);

        // card distribution
        let userCards: Array<string[]> = [];

        for await (const userID of userIds) {
            let tempUsersCards: Array<string> = [];

            for (let j = NUMERICAL.ZERO; j < NUMERICAL.THIRTEEN; j++) {
                const ran = Math.floor(Math.random() * closeDeck.length);
                tempUsersCards.push(closeDeck[ran]);
                closeDeck.splice(ran, NUMERICAL.ONE);
            }

            userCards.push(tempUsersCards);

            const player = await getPlayerGamePlay(userID, tableId);
            player.currentCards = [tempUsersCards];
            await setPlayerGamePlay(userID, tableId, player);

        }
        logger.info("----->> cardsDirtibution :: userCards :: ", userCards);

        // pick one card for open deck
        const openDeckCardIndex = Math.floor(Math.random() * closeDeck.length);
        const openDeckCard = closeDeck[openDeckCardIndex];
        closeDeck.splice(openDeckCardIndex, NUMERICAL.ONE)

        logger.info("----->> cardsDirtibution :: openDeckCard :: ", openDeckCard);

        roundTableData.trumpCard = jokerCard;
        roundTableData.closedDeck = closeDeck;
        roundTableData.opendDeck = [openDeckCard]
        roundTableData.firstTurn = true;
        
        await setRoundTableData(tableId, round, roundTableData);
        await roundHistory(roundTableData, round);

        logger.info("----->> cardsDirtibution :: userIds :: ", userIds);

        return roundTableData;

    } catch (error) {
        console.log(error);
        logger.error(`--- cardDirtibution :: ERROR :: `, error);
        throw error;
    }
}