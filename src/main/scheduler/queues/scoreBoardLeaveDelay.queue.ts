import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { ScoreBoardLeaveDelayQueueTimerIf } from "../../interfaces/schedulerIf";
import ScoreBoardLeaveDelayTimerProcess from "../processes/scoreBoardLeaveDelay.process";



class ScoreBoardLeaveDelayQueueTimer extends QueueBaseClass {
    constructor() {
        super("ScoreBoardLeaveDelayQueueTimer")
        this.queue.process(ScoreBoardLeaveDelayTimerProcess)
    }

    scoreBoardLeaveDelayQueueTimer = async (data: ScoreBoardLeaveDelayQueueTimerIf) => {
        try {

            // data = await schedulerValidator.scoreBoardTimerValidator(data);
            logger.info("----->> ScoreBoardLeaveDelayQueueTimer :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: data.tableId,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' ScoreBoardLeaveDelayQueueTimer ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- ScoreBoardLeaveDelayQueueTimer :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new ScoreBoardLeaveDelayQueueTimer().scoreBoardLeaveDelayQueueTimer;