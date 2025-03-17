import logger from "../../../logger";
import Errors from "../../errors";
import { formatStartTurnInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatStartTurnInfo(
    currentTurnUserId: string,
    currentTurnSI: number,
    previousTurnSI: number,
    turnTimer: number,
    firstTurn: boolean,
    isSecondaryTurn: boolean,
    isSeconderyTurnsRemain : boolean
):Promise<formatStartTurnInfoIf> {
    try {

        let resObj: formatStartTurnInfoIf = {
            currentTurnUserId: currentTurnUserId,
            currentTurnSI: currentTurnSI,
            previousTurnSI: previousTurnSI,
            turnTimer: turnTimer,
            firstTurn: firstTurn,
            isSecondaryTurn : isSecondaryTurn,
            isSeconderyTurnsRemain : isSeconderyTurnsRemain
        };
        resObj = await responseValidator.formatStartTurnInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatStartTurnInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatStartTurnInfo;