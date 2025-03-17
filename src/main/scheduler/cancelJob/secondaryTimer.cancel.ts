import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";


class SecondaryTimerCancel extends QueueBaseClass {
    constructor() {
        super("SecondaryTimerQueue");
    }

    secondaryTimerCancel = async (jobId: string) => {
        try {
            const jobData = await this.queue.getJob(jobId);
            logger.debug('------>> SecondaryTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> SecondaryTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> SecondaryTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> SecondaryTimerCancel :: JOB NOT AVAILABLE :: ");
            }
        } catch (error) {
            logger.error('CATCH_ERROR : SecondaryTimerCancel --:', jobId, error);
        }
    }
}

export = new SecondaryTimerCancel().secondaryTimerCancel;