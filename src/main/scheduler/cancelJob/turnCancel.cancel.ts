import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";


class TurncancelCancel extends QueueBaseClass {
    constructor() {
        super("StartTurnTimerQueue");
    }

    turncancelCancel = async (jobId: string) => {
        try {
            const jobData = await this.queue.getJob(jobId);
            logger.debug('------>> TurncancelCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> TurncancelCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> TurncancelCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> TurncancelCancel :: JOB NOT AVAILABLE :: ");
            }
        } catch (error) {
            logger.error('CATCH_ERROR : TurncancelCancel --:', jobId, error);
        }
    }
}

export = new TurncancelCancel().turncancelCancel;