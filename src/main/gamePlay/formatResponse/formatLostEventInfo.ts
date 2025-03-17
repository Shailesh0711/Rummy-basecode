import logger from "../../../logger";
import Errors from "../../errors";
import { formatLostEventInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formatLostEventInfo(
    tableId: string,
    userId: string,
    seatIndex: number,
):Promise<formatLostEventInfoIf> {
    try {
        let resObj: formatLostEventInfoIf = {
            tableId: tableId,
            userId: userId,
            seatIndex: seatIndex,
        };
        resObj = await responseValidator.formatLostEventInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatLostEventInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatLostEventInfo;