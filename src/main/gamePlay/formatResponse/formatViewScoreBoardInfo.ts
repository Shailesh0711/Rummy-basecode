import logger from "../../../logger";
import Errors from "../../errors"
import { formatScoreBoardInfoIf, formatViewScoreBoardInfoif } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";



async function formatViewScoreBoardInfo(
    data: formatScoreBoardInfoIf
): Promise<formatViewScoreBoardInfoif> {
    try {

        let resObj: formatViewScoreBoardInfoif = {
            tableId: data.tableId,
            trumpCard: data.trumpCard,
            scoreBoradTable: data.scoreBoradTable
        };
        resObj = await responseValidator.formatViewScoreBoardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatViewScoreBoardInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatViewScoreBoardInfo