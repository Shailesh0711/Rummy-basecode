import logger from "../../../logger";
import Errors from "../../errors";
import { formateDeclareInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";

async function formateDeclareInfo(
    declareUserId: string,
    declareSeatIndex: number,
    timer: number,
    tableId: string,
    isValidDeclared: boolean,
    massage: string,
    startDeclarTimerUser: any[],
    openDeck: string[],
    totalPoints : number,
):Promise<formateDeclareInfoIf> {
    try {
        let resObj: formateDeclareInfoIf = {
            isValidDeclared: isValidDeclared,
            declareUserId: declareUserId,
            declareSeatIndex: declareSeatIndex,
            timer: timer,
            tableId: tableId,
            massage: massage,
            startDeclarTimerUser: startDeclarTimerUser,
            openDeck : openDeck,
            totalPoints : totalPoints
        };
        resObj = await responseValidator.formateDeclareInfoValidator(resObj);
        return resObj;
    } catch (error) {
        console.log("---formateDeclareInfo :: ERROR: ", error)
        logger.error("---formateDeclareInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formateDeclareInfo;