import logger from "../../../logger";
import QueueBaseClass from "../queues/queueBaseClass";

class LeaveTableTimerCancel extends QueueBaseClass {
    constructor() {
        super("LeaveTimerQueue");
    }

    leaveTableTimerCancel = async (jobId: any) => {
        try {
            const jobData = await this.queue.getJob(jobId)
            logger.debug('------>> LeaveTableTimerCancel :: JOB CANCELLED  :: JOB ID:" ---- ', jobId);
            logger.debug('------>> LeaveTableTimerCancel :: JOB CANCELLED :: JOB ID:" job ---- ', jobData);
            if (jobData !== null) {
                logger.info("===========>> LeaveTableTimerCancel :: JOB AVAILABLE :: ");
                await jobData.remove();
            } else {
                logger.info("===========>> LeaveTableTimerCancel :: JOB NOT AVAILABLE :: ");
            }

            return jobData;
        } catch (error) {
            logger.error('CATCH_ERROR : LeaveTableTimerCancel --:', jobId, error);
        }
    }
}

export = new LeaveTableTimerCancel().leaveTableTimerCancel;