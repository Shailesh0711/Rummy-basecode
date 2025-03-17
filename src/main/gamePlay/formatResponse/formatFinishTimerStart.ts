import logger from "../../../logger";
import { cards } from "../../interfaces/cards";
import Errors from "../../errors";
import { formatFinishTimerStartIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatFinishTimerStart(
    userId:string,
    tableId:string,
    seatIndex: number,
    turnTimer: number,
    totalScorePoint: number,
    finishCard: string[],
    cards : cards[]
):Promise<formatFinishTimerStartIf>{
    try {
        let resObj: formatFinishTimerStartIf = {
            userId: userId,
            tableId: tableId,
            seatIndex: seatIndex,
            turnTimer: turnTimer,
            totalScorePoint: totalScorePoint,
            cards: cards,
            finishCard: finishCard
        };
        resObj = await responseValidator.formatFinishTimerStartValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatFinishTimerStart :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatFinishTimerStart;