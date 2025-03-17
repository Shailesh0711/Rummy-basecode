import { NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { addClientInRoom, getSocketFromSocketId, leaveClientInRoom } from "../../../../socket";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getUser } from "../../../cache/User";


export async function setNewGameSocketData(
    newTableId: string,
    oldTableId: string,
    dealType: number,
    roundTableData: roundTableIf,
) {
    try {

        let count = NUMERICAL.ZERO;
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO && roundTableData.seats[seat].userStatus !== PLAYER_STATE.LEFT) {

                const playerData = await getUser(roundTableData.seats[seat].userId);

                const socket = await getSocketFromSocketId(playerData.socketId);

                if (socket) {
                    socket.eventMetaData = {
                        userId: playerData.userId,
                        userObjectId: roundTableData.seats[seat]._id,
                        tableId: newTableId,
                        roundId: roundTableData._id,
                        currentRound: NUMERICAL.ONE,
                        dealType: dealType
                    };
                    
                    // console.log("---- setNewGameSocketData :: socket :: ",socket)
                    await addClientInRoom(socket, newTableId);
                    
                    await leaveClientInRoom(socket, oldTableId);
                }
                    
                count += 1;
            }
        }

        logger.info("----->> setNewGameSocketData :: count :: ",count);
        logger.info("----->> setNewGameSocketData :: roundTableData.totalPlayers :: ",roundTableData.totalPlayers);
        if (count === roundTableData.totalPlayers) {
            return true
        }

    } catch (error) {
        console.log(`--- setNewGameSocketData :: ERROR :: `, error);
        logger.error(`--- setNewGameSocketData :: ERROR :: `, error);
        throw error;
    }
}