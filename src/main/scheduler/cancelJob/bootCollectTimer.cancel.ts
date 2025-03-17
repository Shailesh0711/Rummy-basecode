import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class BootCollectTimerCancel extends QueueBaseClass {
    constructor() {
        super("BootAmountCollectQueue");
    }

    bootCollectTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> BootCollectTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> BootCollectTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> BootCollectTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> BootCollectTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : BootCollectTimerCancel --:', jobId, error);
        }
    }
}

export = new BootCollectTimerCancel().bootCollectTimerCancel;