import logger from "../../../logger";
import Errors from "../../errors"
import { formatShowOpenDeckCardsInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatShowOpenDeckCardsInfo(
    tableId:string,
    opendDeck : string[]
) {
    try {
        let resObj:formatShowOpenDeckCardsInfoIf = {
            tableId:tableId,
            opendDeck:opendDeck
        }
        resObj = await responseValidator.formatShowOpenDeckCardsInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatShowOpenDeckCardsInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatShowOpenDeckCardsInfo;