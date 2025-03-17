import { MONGO, NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
// import DB from "../../../db"
import { flageDataIf } from "../../../interfaces/controllersIf";

export async function setGameFlage(
    gameId: string,
): Promise<any> {
    try {
        let date = new Date()

        logger.info("cronJob  :: gameId ::> ", gameId)
        const flage = false;
        // const flage = await DB.mongoQuery.getOne(MONGO.FLAGE, { gameId: gameId });
        logger.info("cronJob  :: flage :: ", flage)

        if (flage) {

            logger.info("get flage ::===>> ", flage);

        } else {
            let flageData: flageDataIf = {
                gameId,
                isPlayingTracking: true,
                noOfLastTrakingDays: NUMERICAL.ZERO,
            }
            console.log('flageData :==>> ', flageData);
            // flageData = await validator.playingTrackingValidator.playingTrackingFlageValidator(flageData);
            // await DB.mongoQuery.add(MONGO.FLAGE, flageData);
        }

    } catch (error) {
        logger.error("CATCH_ERROR : cronJob ", error)
    }

}