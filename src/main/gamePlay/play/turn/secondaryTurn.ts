import { EVENTS, NUMERICAL } from "../../../../constants";
import logger from "../../../../logger";
import { startTurnTimerQueueIf } from "../../../interfaces/schedulerIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import formatStartTurnInfo from "../../formatResponse/formatStartTurnInfo";
import Scheduler from "../../../scheduler";
import commonEventEmitter from "../../../commonEventEmitter";
import { nextPlayerTurn } from "./nextPlayerTurn";
import config from "../../../../connections/config";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";

async function secondaryTurn(
    data: startTurnTimerQueueIf
) {
    const { SECONDARY_TIMER } = config();
    try {
        logger.info("----------->> secondaryTurn <<--------------")
        logger.info(`----->> secondaryTurn :: data :: `,data);
        
        const playerData = await getPlayerGamePlay(data.currentTurnPlayerId, data.tableId);
        logger.info(`----->> secondaryTurn :: playerData :: `,playerData);
        logger.info(`----->> secondaryTurn :: remainSecondryTime :: ${playerData.remainSecondryTime}`);

        if (playerData.remainSecondryTime > NUMERICAL.ZERO) {
            const roundTableData = await getRoundTableData(data.tableId, data.currentRound);
            
            roundTableData.updatedAt = new Date();
            roundTableData.isSecondaryTurn = true;
            
            playerData.remainSecondryTime -= NUMERICAL.ONE;
            playerData.isSecondaryTurn = true;
            playerData.isTurn = true;

            await setRoundTableData(data.tableId, data.currentRound, roundTableData);
            await setPlayerGamePlay(data.currentTurnPlayerId, data.tableId, playerData);

            const formatedTturnInfo = await formatStartTurnInfo(
                data.currentTurnPlayerId,
                data.currentPlayerSeatIndex,
                NUMERICAL.MINUS_ONE, SECONDARY_TIMER,
                false,
                true,
                false
            );

            commonEventEmitter.emit(EVENTS.USER_TURN_STARTED, {
                tableId: data.tableId,
                data: formatedTturnInfo
            });

            await Scheduler.addJob.secondaryTimerQueue({
                tableId: data.tableId,
                timer: SECONDARY_TIMER * NUMERICAL.THOUSAND,
                currentTurnPlayerId: data.currentTurnPlayerId,
                currentRound: data.currentRound,
                currentPlayerSeatIndex: data.currentPlayerSeatIndex,
            });
        } else {
            nextPlayerTurn(data);
        }
    } catch (error) {
        logger.error("----->> secondaryTurn :: ERROR ::", error);
    }
}

export = secondaryTurn;