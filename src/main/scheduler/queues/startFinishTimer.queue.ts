import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { startFinishTimerProcess } from "../processes";
import { StartFinishTimerQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";


class StartFinishTimerQueue extends QueueBaseClass {
    constructor() {
        super("StartFinishTimerQueue")
        this.queue.process(startFinishTimerProcess)
    }

    startFinishTimerQueue = async (data: StartFinishTimerQueueIf) => {
        try {

            data = await schedulerValidator.startFinishTimerValidator(data)
            logger.info("----->> StartFinishTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' StartFinishTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- StartFinishTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new StartFinishTimerQueue().startFinishTimerQueue;

