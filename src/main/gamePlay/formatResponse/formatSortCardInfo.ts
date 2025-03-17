import logger from "../../../logger";
import Errors from "../../errors";
import { cards } from "../../interfaces/cards";
import { formatSortCardInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatSortCardInfo(
    userId: string,
    tableId: string,
    totalPoints: number,
    cards: cards[]
): Promise<formatSortCardInfoIf> {
    try {
        let resObj: formatSortCardInfoIf = {
            userId: userId,
            tableId: tableId,
            totalPoints: totalPoints,
            cards: cards
        };
        resObj = await responseValidator.formatSortCardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatSortCardInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatSortCardInfo;