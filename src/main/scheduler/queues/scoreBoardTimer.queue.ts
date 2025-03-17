import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { scoreBoardTimerIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";
import scoreBoardTimerProcess from "../processes/scoreBoardTimer.process";



class ScoreBoardTimerQueue extends QueueBaseClass {
    constructor() {
        super("newScoreBoardTimerQueue")
        this.queue.process(scoreBoardTimerProcess)
    }

    scoreBoardTimerQueue = async (data: scoreBoardTimerIf) => {
        try {

            data = await schedulerValidator.scoreBoardTimerValidator(data);
            logger.info("----->> ScoreBoardTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' ScoreBoardTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- ScoreBoardTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new ScoreBoardTimerQueue().scoreBoardTimerQueue;