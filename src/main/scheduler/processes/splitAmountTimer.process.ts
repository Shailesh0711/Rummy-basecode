import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";

async function splitAmountTimerProcess(job: any) {
    try {
        logger.info("---->> splitAmountTimerProcess :: JOB ::", job)
        logger.info("---->> splitAmountTimerProcess :: Job Data ::", job.data)
        logger.warn("---->> splitAmountTimerProcess :: Manual split timer over")
        // commonEventEmitter.emit(EVENT_EMITTER.SPLIT_AMOUNT_TIMER_EXPIRE, job.data)

    } catch (error) {
        logger.error("-----splitAmountTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = splitAmountTimerProcess;