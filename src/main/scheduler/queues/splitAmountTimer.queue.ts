import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { splitAmountTimerProcess } from "../processes";
import { splitAmountTimerIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";



class SplitAmountTimerQueue extends QueueBaseClass {
    constructor() {
        super("SplitAmountTimerQueue")
        this.queue.process(splitAmountTimerProcess)
    }

    splitAmountTimerQueue = async (data: splitAmountTimerIf) => {
        try {

            data = await schedulerValidator.splitAmountTimerValidator(data);
            logger.info("----->> SplitAmountTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' SplitAmountTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- SplitAmountTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new SplitAmountTimerQueue().splitAmountTimerQueue;