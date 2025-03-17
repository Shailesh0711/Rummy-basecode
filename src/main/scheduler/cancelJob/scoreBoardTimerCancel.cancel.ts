import QueueBaseClass from "../queues/queueBaseClass";
import logger from "../../../logger";

class ScoreBoardTimerCancel extends QueueBaseClass {
    constructor() {
        super("newScoreBoardTimerQueue");
    }

    scoreBoardTimerCancel = async (jobId: string) => {
        try {
            const jobData = await this.queue.getJob(jobId);
            logger.debug('------>> ScoreBoardTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> ScoreBoardTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> ScoreBoardTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> ScoreBoardTimerCancel :: JOB NOT AVAILABLE :: ");
            }

        } catch (error) {
            logger.error('CATCH_ERROR : ScoreBoardTimerCancel --:', jobId, error);
        }
    }
};

export = new ScoreBoardTimerCancel().scoreBoardTimerCancel;