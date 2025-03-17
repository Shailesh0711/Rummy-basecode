import logger from "../../../logger";
import Errors from "../../errors";
import { cards } from "../../interfaces/cards";
import { formatPickupCloseDeckIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";



async function formatPickupCloseDeck( userId: string,
    tableId: string,
    seatIndex: number,
    totalPoints: number,
    cards: cards[],
    pickUpCard:string
): Promise<formatPickupCloseDeckIf> {
    try {
        let resObj: formatPickupCloseDeckIf = {
            userId: userId,
            tableId: tableId,
            seatIndex:seatIndex,
            totalPoints: totalPoints,
            cards: cards,
            pickUpCard:pickUpCard
        };
        resObj = await responseValidator.formatPickupCloseDeckValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatPickupCloseDeck :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatPickupCloseDeck;