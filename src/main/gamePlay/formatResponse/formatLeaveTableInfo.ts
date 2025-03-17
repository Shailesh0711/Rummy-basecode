import logger from "../../../logger";
import Errors from "../../errors";
import { formatLeaveTableInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatLeaveTableInfo(
    tableId: string,
    userId: string,
    seatIndex: number,
    currentRound: number,
    tableState: string,
    updatedUserCount: number,
    username: string,
    winPrize : number,
    isLeaveBeforeLockIn : boolean,
    message?: string | null
): Promise<formatLeaveTableInfoIf> {
    try {
        let resObj: formatLeaveTableInfoIf = {
            tableId: tableId,
            userId: userId,
            seatIndex: seatIndex,
            currentRound: currentRound,
            tableState: tableState,
            updatedUserCount: updatedUserCount,
            message: message ? message : `${username} is left`,
            winPrize :  winPrize,
            isLeaveBeforeLockIn
        };
        // message
        resObj = await responseValidator.formatLeaveTableInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatLeaveTableInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatLeaveTableInfo;