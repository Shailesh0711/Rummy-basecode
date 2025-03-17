import logger from "../../../logger";
import Errors from "../../errors"
import { formatBootCollectionInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatBootCollectionInfo(
    data: formatBootCollectionInfoIf
): Promise<formatBootCollectionInfoIf> {
    try {

        let resObj: formatBootCollectionInfoIf = {
            balance: data.balance,
            listOfSeatsIndex: data.listOfSeatsIndex,
            winPrice: data.winPrice
        };
        resObj = await responseValidator.formatBootCollectionInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatBootCollectionInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatBootCollectionInfo


