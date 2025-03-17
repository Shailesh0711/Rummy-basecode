import logger from "../../../logger";
import QueueBaseClass from "./queueBaseClass";
import Errors from "../../errors";
import { leaveTableTimerProcess } from "../processes";
import { leaveTableTimerIf } from "../../interfaces/schedulerIf";
import { schedulerValidator } from "../../validator";




class LeaveTableTimerQueue extends QueueBaseClass {
    constructor() {
        super("LeaveTimerQueue")
        this.queue.process(leaveTableTimerProcess)
    }

    leaveTableTimerQueue = async (data: leaveTableTimerIf) => {
        try {

            data = await schedulerValidator.leaveTableTimerValidator(data);
            logger.info("----->> LeaveTableTimerQueue :: data :: ", data)

            const queueOption = {
                delay: data.timer, // in ms
                jobId: `${data.tableId}:${data.userId}`,
                removeOnComplete: true,
            };

            logger.info('-- ');
            logger.info(queueOption, ' LeaveTableTimerQueue ------ ');
            logger.info('-- ');

            await this.queue.add(data, queueOption);

        } catch (error) {
            logger.error("--- LeaveTableTimerQueue :: ERROR ::", error);
            if (error instanceof Errors.CancelBattle) {
                throw new Errors.CancelBattle(error);
            } else {
                throw error;
            }
        }
    }
}

export = new LeaveTableTimerQueue().leaveTableTimerQueue;