import logger from "../../../logger";
import Errors from "../../errors";
import { cards } from "../../interfaces/cards";
import { formatDropRoundInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatDropRoundInfo(
    userId: string,
    tableId: string,
    seatIndex: number,
    totalPoints: number,
    cards: cards[],
    isDrop : boolean
): Promise<formatDropRoundInfoIf> {
    try {
        let resObj: formatDropRoundInfoIf = {
            userId: userId,
            tableId: tableId,
            seatIndex: seatIndex,
            totalPoints: totalPoints,
            cards: cards,
            isDrop: isDrop
        };
        resObj = await responseValidator.formatDropRoundInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatDropRoundInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatDropRoundInfo;