import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors"
import { schedulerValidator } from "../../validator";
import { tossCardTimerQueueIf } from "../../interfaces/schedulerIf";
import tossCardTimerProcess from "../processes/tossCardTimer.process";

class TossCardTimerQueue extends QueueBaseClass {
    constructor() {
        super("TossCardTimerQueueBull")
        this.queue.process(tossCardTimerProcess)
    }

    tossCardTimerQueue = async (data: tossCardTimerQueueIf) => {
        try {

            data = await schedulerValidator.tossCardTSchedulerValidator(data);
            logger.info("----->> TossCardTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' tossCardTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("-- tossCardTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            }else{
                throw error;
            }
        }
    }
}

export = new TossCardTimerQueue().tossCardTimerQueue;