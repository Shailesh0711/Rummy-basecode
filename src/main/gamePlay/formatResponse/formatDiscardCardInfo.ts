import logger from "../../../logger";
import { cards } from "../../interfaces/cards";
import Errors from "../../errors";
import { formatdiscardCardInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatdiscardCardInfo(
    userId: string,
    tableId: string,
    seatIndex: number,
    totalPoints: number,
    cards: cards[],
    discardCard: string[],
    opendDeck : string[]
): Promise<formatdiscardCardInfoIf> {
    try {
        let resObj: formatdiscardCardInfoIf = {
            userId: userId,
            tableId: tableId,
            seatIndex: seatIndex,
            totalPoints: totalPoints,
            cards: cards,
            discardCard: discardCard,
            opendDeck : opendDeck,
        };
        resObj = await responseValidator.formatdiscardCardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatdiscardCardInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatdiscardCardInfo;