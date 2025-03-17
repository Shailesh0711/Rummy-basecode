import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";

async function nextRoundTimerProcess(job: any) {
    try {
        logger.info("---->> nextRoundTimerProcess :: JOB ::", job)
        logger.info("---->> nextRoundTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.NEXT_ROUND_START_TIMER_EXPIRE, job.data)

    } catch (error) {
        logger.error("-----nextRoundTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = nextRoundTimerProcess;