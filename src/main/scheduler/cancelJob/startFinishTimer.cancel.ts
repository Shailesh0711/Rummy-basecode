import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";


class StartFinishTimerCancel extends QueueBaseClass {
    constructor() {
        super("StartFinishTimerQueue");
    }

    startFinishTimerCancel = async (jobId: string) => {
        try {
            const jobData = await this.queue.getJob(jobId);
            logger.debug('------>> StartFinishTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> StartFinishTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> StartFinishTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> StartFinishTimerCancel :: JOB NOT AVAILABLE :: ");
            }

        } catch (error) {
            logger.error('CATCH_ERROR : StartFinishTimerCancel --:', jobId, error);
        }
    }
}

export = new StartFinishTimerCancel().startFinishTimerCancel;
