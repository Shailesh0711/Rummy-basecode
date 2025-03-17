// tossCardTimer
import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class TossCardTimerCancel extends QueueBaseClass {
    constructor() {
        super("TossCardTimerQueueBull");
    }

    tossCardTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> TossCardTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> TossCardTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> TossCardTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> TossCardTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : TossCardTimerCancel --:', jobId, error);
        }
    }
}

export = new TossCardTimerCancel().tossCardTimerCancel;