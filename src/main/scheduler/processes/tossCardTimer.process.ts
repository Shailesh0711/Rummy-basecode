import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";



async function tossCardTimerProcess(job: any) {
    try {
        logger.info("---->> tossCardTimerProcess :: JOB ::", job)
        logger.info("---->> tossCardTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.ROUND_STARTED,job.data)
        
    } catch (error) {
        logger.error("-----tossCardTimerProcess :: ERROR ::", error);
        return undefined;
    }
}


export = tossCardTimerProcess;