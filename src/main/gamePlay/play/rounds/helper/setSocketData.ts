import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { getSocketFromSocketId } from "../../../../socket";
import { getPlayerGamePlay } from "../../../cache/Players";



export async function setScoketData(
    roundTableData: roundTableIf,
    tableId: string,
    nextRound: number
) {
    try {

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                if (
                    roundTableData.seats[seat].userStatus !== PLAYER_STATE.LEFT &&
                    roundTableData.seats[seat].userStatus !== PLAYER_STATE.LOST
                ) {
                    const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);

                    const socket = await getSocketFromSocketId(playerData.socketId);

                    if (socket) {
                        socket.eventMetaData.currentRound = nextRound
                    }
                }
            }
        }

    } catch (error) {
        console.log(`--- setScoketData :: ERROR :: `, error);
        logger.error(`--- setScoketData :: ERROR :: `, error);
        throw error;
    }
}


