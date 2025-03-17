import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";


export async function addPointInRoundWinnerPlayer(
    roundTableData: roundTableIf,
    winnerPlayerData: playerPlayingDataIf,
    tableId: string
) {
    try {
        let totalAddPonit = NUMERICAL.ZERO;
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                if (roundTableData.seats[seat].inGame) {
                    if (
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.DROP_TABLE_ROUND ||
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.LEFT ||
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.LOST ||
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.WRONG_DECLARED
                    ) {
                        if (roundTableData.seats[seat].inGame) {
                            const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId)
                            totalAddPonit += playerData.roundLostPoint;
                        }
                    }
                }
            }
        }

        winnerPlayerData.gamePoints += totalAddPonit;
        await setPlayerGamePlay(winnerPlayerData.userId, tableId, winnerPlayerData)
    } catch (error) {
        logger.error(`--- addPointInRoundWinnerPlayer :: ERROR ::`, error);
    }
}