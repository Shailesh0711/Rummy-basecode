//splitAmountTimerCancel
import QueueBaseClass from "../queues/queueBaseClass";
import logger from "../../../logger";

class SplitAmountTimerCancel extends QueueBaseClass {
    constructor() {
        super("SplitAmountTimerQueue");
    }

    splitAmountTimerCancel = async (jobId: string) => {
        try {
            const jobData = await this.queue.getJob(jobId);
            logger.debug('------>> SplitAmountTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> SplitAmountTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> SplitAmountTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> SplitAmountTimerCancel :: JOB NOT AVAILABLE :: ");
            }

        } catch (error) {
            logger.error('CATCH_ERROR : SplitAmountTimerCancel --:', jobId, error);
            throw error;
        }
    }
};

export = new SplitAmountTimerCancel().splitAmountTimerCancel;