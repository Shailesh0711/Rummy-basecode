import logger from "../../../logger";
import { formatSplitDeclareInfoIf } from "../../interfaces/responseIf";
import { splitAmountDeclareIf } from "../../interfaces/splitAmount";
import { responseValidator } from "../../validator";


async function formatSplitDeclareInfo(
    tableId: string,
    data: splitAmountDeclareIf[]
): Promise<formatSplitDeclareInfoIf> {
    try {
        let resObj: formatSplitDeclareInfoIf = {
            tableId: tableId,
            playerDetails: data
        }
        resObj = await responseValidator.formatSplitDeclareInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("--- formatSplitDeclareInfo :: ERROR :: ", error);
        throw error;
    }
}

export = formatSplitDeclareInfo;