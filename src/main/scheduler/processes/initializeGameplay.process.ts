import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";



async function initializeGameplayProcess(job: any) {
    try {
        logger.info("---->> initializeGameplayProcess :: JOB ::", job)
        logger.info("---->> initializeGameplayProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.LOCK_IN_PERIOD_START, job.data)
    } catch (error) {
        logger.error("initialize Game play Process :: ERROR ::", error);
        return undefined;
    }
}

export = initializeGameplayProcess;