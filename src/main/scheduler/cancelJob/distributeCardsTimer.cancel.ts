import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class DistributeCardsTimerCancel extends QueueBaseClass {
    constructor() {
        super("DistributeCardsQueue");
    }

    distributeCardsTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> DistributeCardsTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> DistributeCardsTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> DistributeCardsTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> DistributeCardsTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : DistributeCardsTimerCancel --:', jobId, error);
        }
    }
}

export = new DistributeCardsTimerCancel().distributeCardsTimerCancel;