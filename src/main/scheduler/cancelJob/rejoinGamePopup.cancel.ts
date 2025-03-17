import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class RejoinGamePopupCancel extends QueueBaseClass {
    constructor() {
        super("RejoinGamePopupQueue");
    }

    rejoinGamePopupCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> RejoinGamePopupCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> RejoinGamePopupCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);

            if (jobData !== null) {

                logger.info("===========>> RejoinGamePopupCancel :: JOB AVAILABLE :: ");
                await jobData.remove();

            } else {
                logger.info("===========>> RejoinGamePopupCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : RejoinGamePopupCancel --:', jobId, error);
        }
    }
}

export = new RejoinGamePopupCancel().rejoinGamePopupCancel;
