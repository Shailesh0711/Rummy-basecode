import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class InitializeGameTimerCancel extends QueueBaseClass {
    constructor() {
        super("InitializeGameplayQueue");
    }

    initializeGameTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> InitializeGameTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> InitializeGameTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> InitializeGameTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> InitializeGameTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : InitializeGameTimerCancel --:', jobId, error);
        }
    }
}

export = new InitializeGameTimerCancel().initializeGameTimerCancel;