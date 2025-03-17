// nextRoundTimer
import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { NextRoundTimerQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";
import { nextRoundTimerProcess } from "../processes";


class NextRoundTimerQueue extends QueueBaseClass {
    constructor() {
        super("NextRoundTimerQueue")
        this.queue.process(nextRoundTimerProcess)
    }

    nextRoundTimerQueue = async (data: NextRoundTimerQueueIf) => {
        try {

            data = await schedulerValidator.nextRoundTimerValidator(data)
            logger.info("----->> NextRoundTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' NextRoundTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- NextRoundTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new NextRoundTimerQueue().nextRoundTimerQueue;

