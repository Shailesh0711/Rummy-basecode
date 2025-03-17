import logger from "../../../logger";
import  Errors from "../../errors";
import { formatReShuffleDeckInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatReShuffleDeckInfo(
    tableId: string,
    opendDeck:string[],
    // closedDeck: string[],
):Promise<formatReShuffleDeckInfoIf>{
    try {
        let resObj: formatReShuffleDeckInfoIf = {
            tableId: tableId,
            opendDeck: opendDeck,
            // closedDeck: closedDeck
        };
        resObj = await responseValidator.formatReShuffleDeckInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatReShuffleDeckInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatReShuffleDeckInfo;