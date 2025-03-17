import logger from "../../../logger";
import Errors from "../../errors"
import { formatRoundstartInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatRoundstartInfo(
    tableId: string,
    timer: number,
    // currentRound: number,
):Promise<formatRoundstartInfoIf> {
    try {
        // const msg = `New  Game Start In ${timer} Seconds....`
        const msg = `Game begins in 0 seconds`
        let resObj: formatRoundstartInfoIf = {
            tableId,
            // currentRound,
            timer,
            msg
        };
        resObj = await responseValidator.formatRoundstartInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatRoundstartInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatRoundstartInfo