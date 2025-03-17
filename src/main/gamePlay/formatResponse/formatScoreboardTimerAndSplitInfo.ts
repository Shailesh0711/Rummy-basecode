import logger from "../../../logger";
import { formatScoreboardTimerAndSplitInfoIf } from "../../interfaces/responseIf";
import { splitPlayerDataIf } from "../../interfaces/scoreBoardIf";
import { responseValidator } from "../../validator";


async function formatScoreboardTimerAndSplitInfo(
    timer: number,
    message: string,
    isSplit: boolean,
    splitUsers: splitPlayerDataIf[],
    isLeaveBtn : boolean
): Promise<formatScoreboardTimerAndSplitInfoIf> {
    try {
        let resObj = {
            timer,
            message,
            isSplit,
            splitUsers,
            isLeaveBtn
        }
        resObj = await responseValidator.formatScoreboardTimerAndSplitInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("--- formatScoreboardTimerAndSplitInfo :: ERROR :: ", error);
        throw error;
    }
}


export = formatScoreboardTimerAndSplitInfo;