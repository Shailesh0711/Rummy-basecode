import logger from "../../../logger";
import Errors from "../../errors"
import { cards } from "../../interfaces/cards"
import { formatProvidCardInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatProvidCardInfo(
    trumpCard: string,
    totalPoint: number,
    cards: Array<cards>,
    openDeckCard: string,
    // closeDeckCard: Array<string>
): Promise<formatProvidCardInfoIf> {
    try {

        let resObj: formatProvidCardInfoIf = {
            trumpCard: [trumpCard],
            openDeckCard: [openDeckCard],
            totalPoint: totalPoint,
            cards: cards,
            // closeDeckCard: closeDeckCard,
        };
        resObj = await responseValidator.formatProvidCardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatProvidCardInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatProvidCardInfo;