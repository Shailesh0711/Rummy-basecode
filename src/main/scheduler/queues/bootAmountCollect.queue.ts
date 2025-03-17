import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors"
import { bootAmountCollectProcess } from "../processes";
import { bootAmountCollectQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";

class BootAmountCollectQueue extends QueueBaseClass {

    constructor() {
        super(`BootAmountCollectQueue`);
        this.queue.process(bootAmountCollectProcess)
    }

    bootAmountCollectQueue = async (data: bootAmountCollectQueueIf) => {
        try {

            data = await schedulerValidator.bootAmountCollectSchedulerValidator(data);
            logger.info("----->> BootAmountCollectQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' bootAmountCollectQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- bootAmountCollectQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new BootAmountCollectQueue().bootAmountCollectQueue;