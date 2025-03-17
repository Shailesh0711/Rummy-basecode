import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";



async function distributeCardsProcess(job: any) {
    try {
        logger.info("---->> distributeCardsProcess :: JOB ::", job)
        logger.info("---->> distributeCardsProcess :: Job Data ::", job.data)
        commonEventEmitter.emit(EVENT_EMITTER.START_FIRST_TURN, job.data)
    } catch (error) {
        logger.error("----distributeCardsProcess :: ERROR ::", error);
        return undefined;
    }
}

export = distributeCardsProcess