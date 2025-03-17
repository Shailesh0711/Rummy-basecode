import logger from "../../../logger";
import { UserInfoIf } from "../../interfaces/scoreBoardIf";
import { responseValidator } from "../../validator";


async function formatPoolRummyDeclareInScoreboardInfo(
    userInfo: UserInfoIf,
    winnerUser?: UserInfoIf,
): Promise<UserInfoIf[]> {
    try {

        let resObj: UserInfoIf[] = winnerUser ? [{ ...winnerUser }, { ...userInfo }] : [{ ...userInfo }]

        resObj = await responseValidator.formatDeclareInScoreboardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("--- formatDeclareInScoreboardInfo :: ERROR :: ", error);
        throw error;
    }
}


export = formatPoolRummyDeclareInScoreboardInfo;