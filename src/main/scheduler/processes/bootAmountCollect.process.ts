import { EVENTS, EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";


async function bootAmountCollectProcess(job: any) {
    try {
        logger.info("---->> bootAmountCollectProcess :: JOB ::", job)
        logger.info("---->> bootAmountCollectProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.BOOT_AMOUNT_COLLECTION_TIMER, job.data)
    } catch (error) {
        logger.error("bootAmountCollectProcess :: ERROR ::", error);
        return undefined;
    }
}

export = bootAmountCollectProcess