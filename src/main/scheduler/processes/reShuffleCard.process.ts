import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";


async function reShuffleCardProcess(job: any) {
    try {
        logger.info("---->> reShuffleCardProcess :: JOB ::", job)
        logger.info("---->> reShuffleCardProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.RE_SHUFFLE_TIMER_EXPIRE, job.data)

    } catch (error) {
        logger.error("-----reShuffleCardProcess :: ERROR ::", error);
        return undefined;
    }
}

export = reShuffleCardProcess;