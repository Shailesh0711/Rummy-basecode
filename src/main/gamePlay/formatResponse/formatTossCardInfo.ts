import logger from "../../../logger";
import Errors from "../../errors"
import { formatTossCardInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";



async function formatTossCardInfo(
    data: formatTossCardInfoIf
    ):Promise<formatTossCardInfoIf> {
    try {

        let resObj: formatTossCardInfoIf = {
            tableId: data.tableId,
            tossWinnerPlayer: {
                ...data.tossWinnerPlayer,
                message : `${data.tossWinnerPlayer.username} won the toss.`
            },
            tossDetail: data.tossDetail
        };
        resObj = await responseValidator.formatTossCardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatTossCardInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatTossCardInfo