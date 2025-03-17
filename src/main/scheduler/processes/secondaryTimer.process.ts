import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";


async function secondaryTimerProcess(job: any) {
    try {
        logger.info("---->> SecondaryTimerProcess :: JOB ::", job)
        logger.info("---->> SecondaryTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.SEONDARY_TIMER_EXPIRE, job.data);

    } catch (error) {
        logger.error("-----SecondaryTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = secondaryTimerProcess;