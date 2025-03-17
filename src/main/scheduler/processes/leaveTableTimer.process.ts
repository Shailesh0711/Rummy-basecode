import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";

async function leaveTimerProcess(job: any) {
    try {
        logger.info("---->> leaveTimerProcess :: JOB ::", job)
        logger.info("---->> leaveTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.LEAVE_TABLE_TIME_OUT, job.data)

    } catch (error) {
        logger.error("-----leaveTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = leaveTimerProcess;


