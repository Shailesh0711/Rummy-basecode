import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class LockInPeriodTimerCancel extends QueueBaseClass {
    constructor() {
        super("LockInPeriodTimerQueue");
    }

    lockInPeriodTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> LockInPeriodTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> LockInPeriodTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> LockInPeriodTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> LockInPeriodTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : LockInPeriodTimerCancel --:', jobId, error);
        }
    }
}

export = new LockInPeriodTimerCancel().lockInPeriodTimerCancel;