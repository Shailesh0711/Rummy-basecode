import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";

async function scoreBoardTimerProcess(job: any) {
    try {
        logger.info("---->> scoreBoardTimerProcess :: JOB ::", job)
        logger.info("---->> scoreBoardTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.SCORE_BOARD_TIMER_EXPIRE, job.data)

    } catch (error) {
        logger.error("-----scoreBoardTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = scoreBoardTimerProcess;