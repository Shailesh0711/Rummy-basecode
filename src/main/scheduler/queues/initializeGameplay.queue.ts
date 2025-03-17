import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors"
import { initializeGameplayIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";
import { initializeGameplayProcess } from "../processes";

class InitializeGameplayQueue extends QueueBaseClass {

    constructor() {
        super("InitializeGameplayQueue");
        this.queue.process(initializeGameplayProcess)
    }
    initializeGameplayQueue = async (data: initializeGameplayIf) => {
        try {

            data = await schedulerValidator.initializeGameplaySchedulerValidator(data);
            logger.info("----->> InitializeGameplayQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' initializeGameplay ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- InitializeGameplayQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            }else{
                throw error;
            }
        }
    }
}

export = new InitializeGameplayQueue().initializeGameplayQueue;