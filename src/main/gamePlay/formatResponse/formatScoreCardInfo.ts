import { NUMERICAL } from "../../../constants";
import logger from "../../../logger"
import { formatScoreCardInfoIf } from "../../interfaces/responseIf";
import { ScoreObjIf } from "../../interfaces/scoreBoardIf";
import { responseValidator } from "../../validator";


export async function formatScoreCardInfo(
    scoreObj: ScoreObjIf,
    userId: string,
    poolType : number,
) {
    try {
        const scoreObject:ScoreObjIf = JSON.parse(JSON.stringify(scoreObj));
        let indexCount = NUMERICAL.ZERO;

        for (const userID of scoreObj.usersId) {
            if (userId === userID) {
                scoreObj.userName.splice(indexCount, 1);
                scoreObj.usersId.splice(indexCount, 1);
                scoreObj.totalScore.splice(indexCount, 1);
                break;
            }
            indexCount += 1;
        }
        scoreObj.userName.unshift("You");
        scoreObj.usersId.unshift(userId);
        scoreObj.totalScore.unshift(scoreObject.totalScore[indexCount]);
        let arrCount = 0;
        for (const dealScore of scoreObj.score) {
            dealScore.splice(indexCount, NUMERICAL.ONE);
            dealScore.unshift(scoreObject.score[arrCount][indexCount]);
            arrCount += 1;
        }
        
        let noCount = NUMERICAL.ONE;
        for await (const dealScore of scoreObj.score){
            dealScore.unshift(noCount)
            noCount += NUMERICAL.ONE;
        }

        let resObj : formatScoreCardInfoIf = {
            title: ["Deal",...scoreObj.userName],
            roundScore: scoreObj.score,
            totalScore: ["Score", ...scoreObj.totalScore],
            rows: scoreObj.score.length 
        }
        resObj = await responseValidator.formatScoreCardInfoValidator(resObj);
        return resObj
    } catch (error) {
        logger.error(`---- formatScoreCardInfo :: ERROR :: `, error);
        throw error;
    }
}