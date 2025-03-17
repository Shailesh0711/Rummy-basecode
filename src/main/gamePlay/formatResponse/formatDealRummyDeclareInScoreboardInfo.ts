import logger from "../../../logger";
import { UserInfoIf } from "../../interfaces/scoreBoardIf";
import { responseValidator } from "../../validator";


async function formatDealRummyDeclareInScoreboardInfo(
    userInfo: UserInfoIf,
    winerPlayer?: UserInfoIf[]
): Promise<UserInfoIf[]> {
    try {
        let resObj: UserInfoIf[] = winerPlayer ? [...winerPlayer, userInfo] : [userInfo];

        for (const res of resObj) {
            res.gameScore = String(res.gameScore);
        }

        resObj = await responseValidator.formatDeclareInScoreboardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("--- formatDeclareInScoreboardInfo :: ERROR :: ", error);
        throw error;
    }
}


export = formatDealRummyDeclareInScoreboardInfo;