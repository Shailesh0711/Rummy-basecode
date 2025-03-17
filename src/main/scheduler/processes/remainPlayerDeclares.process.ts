import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";

async function remainPlayersdeclarTimerProcess(job: any) {
    try {
        logger.info("---->> remainPlayersdeclarTimerProcess :: JOB ::", job)
        logger.info("---->> remainPlayersdeclarTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.REMAIN_PLAYERS_TIMER_EXPIRE, job.data)

    } catch (error) {
        logger.error("-----remainPlayersdeclarTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = remainPlayersdeclarTimerProcess;