import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { AutoSplitTimerQueueIf } from "../../interfaces/schedulerIf";
import { autoSplitTimerProcess } from "../processes";
import { schedulerValidator } from "../../validator";


class AutoSplitTimerQueue extends QueueBaseClass {
    constructor() {
        super("AutoSplitTimerQueue")
        this.queue.process(autoSplitTimerProcess)
    }

    autoSplitTimerQueue = async (data: AutoSplitTimerQueueIf) => {
        try {

            data = await schedulerValidator.autoSplitTimerSchedulerValidator(data);
            logger.info("----->> autoSplitTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' autoSplitTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- autoSplitTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new AutoSplitTimerQueue().autoSplitTimerQueue;