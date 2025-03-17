import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class WaitingPlayerCancel extends QueueBaseClass {
    constructor() {
        super("WaitingForPlayerQueue");
    }

    waitingPlayerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> WaitingPlayerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> WaitingPlayerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> WaitingPlayerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> WaitingPlayerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : WaitingPlayerCancel --:', jobId, error);
        }
    }
}

export = new WaitingPlayerCancel().waitingPlayerCancel;