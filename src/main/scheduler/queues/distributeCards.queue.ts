import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors"
import { distributeCardsProcess } from "../processes";
import { distributeCardsQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";


class DistributeCardsQueue extends QueueBaseClass {
    constructor() {
        super("DistributeCardsQueue")
        this.queue.process(distributeCardsProcess)
    }

    distributeCardsQueue = async (data: distributeCardsQueueIf) => {
        try {

            data = await schedulerValidator.distributeCardsSchedulerValidator(data);
            logger.info("----->> DistributeCardsQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' DistributeCardsQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- DistributeCardsQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new DistributeCardsQueue().distributeCardsQueue;