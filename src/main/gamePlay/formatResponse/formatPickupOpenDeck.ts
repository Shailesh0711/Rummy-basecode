import logger from "../../../logger";
import Errors from "../../errors";
import { cards } from "../../interfaces/cards";
import { formatPickupOpenDeckIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatPickupOpenDeck(
    userId: string,
    tableId: string,
    seatIndex: number,
    totalPoints: number,
    cards: cards[],
    openDeck: string[],
    pickUpCard: string
): Promise<formatPickupOpenDeckIf> {
    try {
        let resObj: formatPickupOpenDeckIf = {
            userId: userId,
            tableId: tableId,
            seatIndex: seatIndex,
            totalPoints: totalPoints,
            cards: cards,
            openDeck: openDeck,
            pickUpCard:pickUpCard
        };
        resObj = await responseValidator.formatPickupOpenDeckValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatPickupOpenDeck :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatPickupOpenDeck;