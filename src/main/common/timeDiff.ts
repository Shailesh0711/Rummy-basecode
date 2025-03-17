import { NUMERICAL } from "../../constants";
import logger from "../../logger";


function timeDifference(nowDate: Date, previousDate: Date, timer: number): number {
    try {
        const now = new Date(nowDate).getTime();
        const previous = new Date(previousDate).getTime();
        const Diff = (now - previous) / 1000;
        const diff = timer - Diff

        if (diff > NUMERICAL.ZERO) {
            return Math.floor(diff);
        } else {
            return NUMERICAL.ZERO;
        }
    } catch (error) {
        logger.error("---timeDifference :: ERROR ::", error);
        throw error;
    }
}

export = timeDifference;