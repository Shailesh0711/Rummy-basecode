import logger from "../../../logger";
import Errors from "../../errors"
import { formatRoundstartInfoIf, formatWaitingPlayersInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatWaitingPlayersInfo(
    tableId: string,
    currentRound: number,
    timer: number,
):Promise<formatWaitingPlayersInfoIf> {
    try {
        // const msg = `Waiting For Another Player till ${timer} Seconds ...`
        const msg = `Waiting For Another Player till 0 Seconds ...`
        let resObj: formatWaitingPlayersInfoIf = {
            tableId,
            currentRound,
            timer,
            msg
        };
        resObj = await responseValidator.formatWaitingPlayersInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatWaitingPlayersInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatWaitingPlayersInfo