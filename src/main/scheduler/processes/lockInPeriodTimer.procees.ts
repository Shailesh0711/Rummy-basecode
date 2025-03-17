import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";



async function lockInPeriodTimerProcess(job: any) {
    try {
        logger.info("---->> lockInPeriodTimerProcess :: JOB ::", job)
        logger.info("---->> lockInPeriodTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.INITIALIZE_GAME_PLAY, job.data)
    } catch (error) {
        logger.error("lockInPeriodTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = lockInPeriodTimerProcess;