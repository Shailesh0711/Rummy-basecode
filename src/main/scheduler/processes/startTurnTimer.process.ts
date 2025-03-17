import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";


async function startTurnTimerProcess(job:any){
    try {
        logger.info("---->> startTurnTimerProcess :: JOB ::", job)
        logger.info("---->> startTurnTimerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.USER_TURN_EXPIRE,job.data)
        
    } catch (error) {
        logger.error("-----startTurnTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = startTurnTimerProcess;