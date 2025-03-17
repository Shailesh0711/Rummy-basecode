import QueueBaseClass from "../queues/queueBaseClass";
import logger from "../../../logger";

class RemainPlayersdeclarTimerCancel extends QueueBaseClass {
    constructor() {
        super("RemainPlayersdeclarTimerQueue");
    }

    remainPlayersdeclarTimerCancel = async (jobId: string) => {
        try {
            const jobData = await this.queue.getJob(jobId);
            logger.debug('------>> RemainPlayersdeclarTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> RemainPlayersdeclarTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> RemainPlayersdeclarTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> RemainPlayersdeclarTimerCancel :: JOB NOT AVAILABLE :: ");
            }

        } catch (error) {
            logger.error('CATCH_ERROR : RemainPlayersdeclarTimerCancel --:', jobId, error);
        }
    }
};

export = new RemainPlayersdeclarTimerCancel().remainPlayersdeclarTimerCancel;