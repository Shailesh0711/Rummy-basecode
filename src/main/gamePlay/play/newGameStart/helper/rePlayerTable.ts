import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { setPlayerGamePlay } from "../../../cache/Players";
import { setRoundTableHistory } from "../../../cache/RoundHistory";
import { setRejoinTableHistory } from "../../../cache/TableHistory";
import { getUser } from "../../../cache/User";
import { defaultPlayerGamePlayData } from "../../../defaultGenerator";


export async function rePlayerTable(
    tableId: string,
    gameId: string,
    lobbyId: string,
    roundTableData: roundTableIf
) {
    try {

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                
                const userData = await getUser(roundTableData.seats[seat].userId);

                logger.info(`------>> rePlayerTable :: userData :: `, userData);

                const playerData = await defaultPlayerGamePlayData({
                    ...userData,
                    roundTableId: tableId,
                    seatIndex: roundTableData.seats[seat].seatIndex
                });

                playerData.userStatus = PLAYER_STATE.PLAYING;
                playerData.playingStatus = PLAYER_STATE.PLAYING;

                await setPlayerGamePlay(userData.userId, tableId, playerData);

                // set rejoin history
                await setRejoinTableHistory(
                    userData.userId,
                    gameId,
                    lobbyId,
                    {
                        userId: userData.userId,
                        tableId,
                        lobbyId,
                        isEndGame: false,
                    },
                )
            }
        }

    } catch (error) {
        console.log(`--- rePlayerTable :: ERROR :: `, error);
        logger.error(`--- rePlayerTable :: ERROR :: `, error);
        throw error;
    }
}