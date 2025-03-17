import { EVENT_EMITTER, NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";



async function waitingForPlayerProcess(job: any) {
    try {
        logger.info("---->> waitingForPlayerProcess :: JOB ::", job)
        logger.info("---->> waitingForPlayerProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.WAITING_PLAYERS_EVENT_END,job.data)
        
    } catch (error) {
        logger.error("waiting For Player Process :: ERROR ::", error);
        return undefined;
    }
}

export = waitingForPlayerProcess;