import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors"
import { waitingForPlayerProcess } from "../processes";
import { waitingForPlayerIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";

class WaitingForPlayerQueue extends QueueBaseClass {

    constructor() {
        super("WaitingForPlayerQueue");
        this.queue.process(waitingForPlayerProcess)
    }
    waitingForPlayerQueue = async (data: waitingForPlayerIf) => {
        try {

            data = await schedulerValidator.waitingForPlayerSchedulerValidator(data);
            logger.info("----->> WaitingForPlayerQueue :: data :: ", data)
            
            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' waitingForPlayer ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- WaitingForPlayerQueue:: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            }else{
                throw error;
            }
        }
    }
}

export = new WaitingForPlayerQueue().waitingForPlayerQueue;