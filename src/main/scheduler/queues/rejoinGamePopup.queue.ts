import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { rejoinGamePopupProcess } from "../processes";
import { RejoinGamePopupQueueIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";


class RejoinGamePopupQueue extends QueueBaseClass {
    constructor() {
        super("RejoinGamePopupQueue")
        this.queue.process(rejoinGamePopupProcess)
    }

    rejoinGamePopupQueue = async (data: RejoinGamePopupQueueIf) => {
        try {

            data = await schedulerValidator.rejoinGamePopupValidator(data);
            logger.info("----->> RejoinGamePopupQueue :: data :: ", data)

            const queueOption = {   
                delay: data.timer, // in ms
                jobId: `${data.tableId}`,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' RejoinGamePopupQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- RejoinGamePopupQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new RejoinGamePopupQueue().rejoinGamePopupQueue;
