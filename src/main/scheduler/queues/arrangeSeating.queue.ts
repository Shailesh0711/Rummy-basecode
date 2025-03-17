import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors"
import arrageSeatingProcess from "../processes/arrageSeating.process";
import { arrageSeatingQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";

class ArrageSeatingQueue extends QueueBaseClass {

    constructor() {
        super(`ArrageSeatingQueue`);
        this.queue.process(arrageSeatingProcess)
    }

    arrageSeatingQueue = async (data: arrageSeatingQueueIf) => {
        try {

            data = await schedulerValidator.arrageSeatingSchedulerValidator(data);
            logger.info("----->> ArrageSeatingQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' ArrageSeatingQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- ArrageSeatingQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new ArrageSeatingQueue().arrageSeatingQueue;