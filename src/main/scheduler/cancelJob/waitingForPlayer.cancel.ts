import { EVENTS, EVENT_EMITTER, NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import QueueBaseClass from "../queues/queueBaseClass";


class WaitingForPlayerCancel extends QueueBaseClass {
    constructor() {
        super("WaitingForPlayerQueue");
    }

    waitingForPlayerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> WaitingForPlayerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> WaitingForPlayerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> WaitingForPlayerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> WaitingForPlayerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : WaitingForPlayerCancel --:', jobId, error);
        }
    }
}

export = new WaitingForPlayerCancel().waitingForPlayerCancel;