import logger from "../../../logger";
import Errors from "../../errors";
import { formatSettingMenuTableInfo } from "../../interfaces/responseIf";
import { dropIF } from "../../interfaces/utils";
import { responseValidator } from "../../validator";


async function formatSettingMenuTableInfo(
    tableId: string,
    gameType: string,
    variant: string,
    numberOfDeck: number,
    printedJoker: string,
    printedValue: number,
    drop: dropIF
): Promise<formatSettingMenuTableInfo> {
    try {
        let resObj: formatSettingMenuTableInfo = {
            tableId: tableId,
            gameType: gameType,
            variant: variant,
            numberOfDeck: numberOfDeck,
            printedJoker: printedJoker,
            printedValue: printedValue,
            drop : drop
        }

        resObj = await responseValidator.formatSettingMenuTableInfoValidator(resObj);

        return resObj;
    } catch (error) {
        logger.error("--- formatSettingMenuTableInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatSettingMenuTableInfo;