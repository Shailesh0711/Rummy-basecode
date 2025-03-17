import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { startTurnTimerQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";
import secondaryTimerProcess from "../processes/secondaryTimer.process";


class SecondaryTimerQueue extends QueueBaseClass {
    constructor() {
        super("SecondaryTimerQueue")
        this.queue.process(secondaryTimerProcess)
    }

    secondaryTimerQueue = async (data: startTurnTimerQueueIf) => {
        try {

            data = await schedulerValidator.startTurnTSchedulerValidator(data);
            logger.info("----->> secondaryTimerQueue :: data :: ", data);

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' secondaryTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- secondaryTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new SecondaryTimerQueue().secondaryTimerQueue;
