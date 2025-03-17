// formatNextRoundStartInfo
import logger from "../../../logger";
import Errors from "../../errors";
import { formatNextRoundStartInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatNextRoundStartInfo(
    tableId: string,
    timer : number,
):Promise<formatNextRoundStartInfoIf> {
    try {
        const msg = `next round start in ${timer}`
        let resObj: formatNextRoundStartInfoIf = {
            tableId: tableId,
            timer : timer,
            message : msg
        };
        resObj = await responseValidator.formatNextRoundStartInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatNextRoundStartInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatNextRoundStartInfo;