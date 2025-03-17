import { EVENT_EMITTER } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";
import { leaveRoundTable } from "../../gamePlay/play/leaveTable/leaveRoundTable";
import ScoreBoard from "../../gamePlay/play/scoreBoard/scoreBoad";

async function rejoinGamePopupProcess(job: any) {
    try {
        logger.info("---->> rejoinGamePopupProcess :: JOB ::", job)
        logger.info("---->> rejoinGamePopupProcess :: Job Data ::", job.data)

        commonEventEmitter.emit(EVENT_EMITTER.REJOIN_GAME_TIMER_EXPIRE, job.data)

    } catch (error) {
        logger.error("-----rejoinGamePopupProcess :: ERROR ::", error);
        return undefined;
    }
}

export = rejoinGamePopupProcess;
