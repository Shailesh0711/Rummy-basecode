import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";


async function startFinishTimerProcess(job: any) {
    try {
        logger.info("---->> startFinishTimerProcess :: JOB ::", job)
        logger.info("---->> startFinishTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.START_FINISH_TIMER_EXPIRE,job.data)

    } catch (error) {
        logger.error("-----startFinishTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = startFinishTimerProcess;