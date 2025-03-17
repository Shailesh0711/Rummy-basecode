import { EVENTS, EVENT_EMITTER, NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import QueueBaseClass from "../queues/queueBaseClass";


class StartTurnCancel extends QueueBaseClass {
    constructor() {
        super("StartTurnTimerQueue");
    }

    startTurnCancel = async (jobId: string) => {
        try {
            const jobData = await this.queue.getJob(jobId);
            logger.debug('------>> StartTurnCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> StartTurnCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> StartTurnCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> StartTurnCancel :: JOB NOT AVAILABLE :: ");
            }
        } catch (error) {
            logger.error('CATCH_ERROR : StartTurnCancel --:', jobId, error);
        }
    }
}

export = new StartTurnCancel().startTurnCancel;