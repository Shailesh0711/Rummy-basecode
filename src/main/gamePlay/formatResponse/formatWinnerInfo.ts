import logger from "../../../logger";
import Errors from "../../errors";
import { formatWinnerInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatWinnerInfo(
    tableId: string,
    winnerId: string,
    winnerSI: number,
    winAmount: number,
    balance: number
): Promise<formatWinnerInfoIf> {
    try {
        let resObj: formatWinnerInfoIf = {
            tableId: tableId,
            userId: winnerId,
            seatIndex: winnerSI,
            winAmount: winAmount,
            balance: balance
        };
        resObj = await responseValidator.formatWinnerInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatWinnerInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatWinnerInfo;