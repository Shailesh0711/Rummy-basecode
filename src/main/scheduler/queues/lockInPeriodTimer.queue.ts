import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { lockInPeriodTimerQueueIf } from "../../interfaces/schedulerIf"
import { lockInPeriodTimerProcess } from "../processes";
import { schedulerValidator } from "../../validator";


class LockInPeriodTimerQueue extends QueueBaseClass {
    constructor() {
        super("LockInPeriodTimerQueue")
        this.queue.process(lockInPeriodTimerProcess)
    }

    lockInPeriodTimerQueue = async (data: lockInPeriodTimerQueueIf) => {
        try {

            data = await schedulerValidator.lockInPeriodTimerValidator(data);
            logger.info("----->> LockInPeriodTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' LockInPeriodTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- LockInPeriodTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new LockInPeriodTimerQueue().lockInPeriodTimerQueue;