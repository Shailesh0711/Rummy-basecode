import { PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { RejoinGamePopupQueueIf } from "../../../../interfaces/schedulerIf";
import { getLock } from "../../../../lock";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { leaveRoundTable } from "../../leaveTable/leaveRoundTable";
import ScoreBoard from "../scoreBoad";

export async function rejoinGameTimerExpire(data: RejoinGamePopupQueueIf) {

    try {
        const { tableId, currentRound, playersId } = data;

        const roundtableData = await getRoundTableData(tableId, currentRound);
        logger.info("---->> rejoinGameTimerExpire :: roundtableData ::", roundtableData);

        for await (const userId of playersId) {

            if (roundtableData.eliminatedPlayers.includes(userId)) {

                let rejoinGameTimerExpireLocks = await getLock().acquire([`locks:${tableId}:${userId}`], 2000);
                try {
                    const playerData = await getPlayerGamePlay(userId, tableId)
                    logger.info("---->> rejoinGameTimerExpire :: playerData ::", playerData);

                    if (playerData.isWaitingForRejoinPlayer) {

                        playerData.playingStatus = PLAYER_STATE.LOST;
                        playerData.userStatus = PLAYER_STATE.LOST;
                        playerData.isWaitingForRejoinPlayer = false;

                        roundtableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.LOST;

                        await setPlayerGamePlay(playerData.userId, tableId, playerData);
                        await setRoundTableData(tableId, currentRound, roundtableData);

                        if (rejoinGameTimerExpireLocks) {
                            await getLock().release(rejoinGameTimerExpireLocks);
                        }

                        await leaveRoundTable(
                            false,
                            true,
                            userId,
                            tableId,
                            currentRound
                        );

                    }
                } catch (error) {
                    logger.error("---- rejoinGameTimerExpire :: playerData.isWaitingForRejoinPlayer :: LOCK :: ERROR : ", error)
                }
            }
        }

        await ScoreBoard(tableId, currentRound, false, true);

    } catch (error) {
        logger.error('----- rejoinGameTimerExpire :: ERROR :: ', error);
    }
}
