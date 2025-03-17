import logger from "../../../logger";
import { getRoundTableData, setRoundTableData } from "../../gamePlay/cache/Rounds";

async function ScoreBoardLeaveDelayTimerProcess(job: any) {
    try {
        logger.info("---->> ScoreBoardLeaveDelayTimerProcess :: JOB ::", job)
        logger.info("---->> ScoreBoardLeaveDelayTimerProcess :: Job Data ::", job.data)

        const roundTableData = await getRoundTableData(job.data.tableId, job.data.currentRound);

        roundTableData.isGameOver = true;

        await setRoundTableData(job.data.tableId, job.data.currentRound, roundTableData)

    } catch (error) {
        logger.error("-----ScoreBoardLeaveDelayTimerProcess :: ERROR ::", error);
        return undefined;
    }
}

export = ScoreBoardLeaveDelayTimerProcess;