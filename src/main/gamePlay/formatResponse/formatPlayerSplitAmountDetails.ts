import logger from "../../../logger";
import { formatPlayerSplitAmountDetailsIf } from "../../interfaces/responseIf";
import { playersSplitAmountDetailsIf } from "../../interfaces/splitAmount";
import { responseValidator } from "../../validator";


async function formatPlayerSplitAmountDetails(
    tableId: string,
    message: string,
    timer: number,
    playersDetails: playersSplitAmountDetailsIf[]
): Promise<formatPlayerSplitAmountDetailsIf> {
    try {
        let resObj: formatPlayerSplitAmountDetailsIf = {
            tableId: tableId,
            message : message,
            title : ``,
            timer : timer,
            playersSplitAmountDetails: playersDetails
        }
        resObj = await responseValidator.formatPlayerSplitAmountDetailsValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("--- formatPlayerSplitAmountDetails :: ERROR :: ", error);
        throw error;
    }
}

export = formatPlayerSplitAmountDetails;