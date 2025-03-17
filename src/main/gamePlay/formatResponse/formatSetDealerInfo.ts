import logger from "../../../logger";
import Errors from "../../errors"
import { setDealerInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatSetDealerInfo(
    data: setDealerInfoIf
): Promise<setDealerInfoIf> {
    try {
        const { userId, username, seatIndex, tableId } = data

        let resObj: setDealerInfoIf = {
            tableId: data.tableId,
            userId: data.userId,
            username: data.username,
            seatIndex: data.seatIndex,
            currentRound : data.currentRound
        };
        resObj = await responseValidator.formatSetDealerInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatSetDealerInfo :: ',
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatSetDealerInfo