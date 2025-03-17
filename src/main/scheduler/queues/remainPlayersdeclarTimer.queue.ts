import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { RemainPlayersdeclarTimerQueueIf, StartFinishTimerQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";
import { remainPlayersdeclarTimerProcess } from "../processes";


class RemainPlayersdeclarTimerQueue extends QueueBaseClass {
    constructor() {
        super("RemainPlayersdeclarTimerQueue")
        this.queue.process(remainPlayersdeclarTimerProcess)
    }

    remainPlayersdeclarTimerQueue = async (data: RemainPlayersdeclarTimerQueueIf) => {
        try {

            data = await schedulerValidator.remainPlayersdeclarTimerValidator(data)
            logger.info("----->> RemainPlayersdeclarTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' RemainPlayersdeclarTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- RemainPlayersdeclarTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new RemainPlayersdeclarTimerQueue().remainPlayersdeclarTimerQueue;

