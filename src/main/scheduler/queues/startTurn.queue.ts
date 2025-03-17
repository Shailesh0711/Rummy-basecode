import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { startTurnTimerQueueIf } from "../../interfaces/schedulerIf";
import startTurnTimerProcess from "../processes/startTurnTimer.process";
import { schedulerValidator } from "../../validator";


class StartTurnTimerQueue extends QueueBaseClass {
    constructor() {
        super("StartTurnTimerQueue")
        this.queue.process(startTurnTimerProcess)
    }

    startTurnTimerQueue = async (data: startTurnTimerQueueIf) => {
        try {
            
            data = await schedulerValidator.startTurnTSchedulerValidator(data);
            logger.info("----->> StartTurnTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' startTurnTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- startTurnTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new StartTurnTimerQueue().startTurnTimerQueue;
