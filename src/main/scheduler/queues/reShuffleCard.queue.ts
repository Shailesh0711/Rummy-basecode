import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { reShuffleCardQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";
import { reShuffleCardProcess } from "../processes";



class ReShuffleCardQueue extends QueueBaseClass {
    constructor() {
        super("ReShuffleCardQueue");
        this.queue.process(reShuffleCardProcess)
    }

    reShuffleCardQueue = async (data: reShuffleCardQueueIf) => {
        try {

            data = await schedulerValidator.reShuffleCardsSchedulerValidator(data);
            logger.info("----->> ReShuffleCardQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };


            logger.info('-- ');
            logger.info(queueOption, ' ReShuffleCardQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- ReShuffleCardQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new ReShuffleCardQueue().reShuffleCardQueue;