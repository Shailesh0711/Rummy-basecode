import { EVENTS, EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";


async function autoSplitTimerProcess(job: any) {
    try {
        logger.info("---->> autoSplitTimerProcess :: JOB ::", job)
        logger.info("---->> autoSplitTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.AUTO_SPLIT_TIMER_EXPIRE, job.data)
    } catch (error) {
        logger.error("autoSplitTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = autoSplitTimerProcess;