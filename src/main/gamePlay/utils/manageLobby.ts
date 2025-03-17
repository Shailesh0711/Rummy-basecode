import { NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import { RejoinTableHistoryIf } from "../../interfaces/playerPlayingTableIf";
import { getLobbyHistory, setLobbyHistory } from "../cache/LobbyHistory";
import { getRejoinTableHistory } from "../cache/TableHistory";


async function setLobby(
    userId: string,
    lobbyId: string,
) {
    try {
        let lobby = await getLobbyHistory(userId);
        let remeinLobbyIds = [];
        if (!lobby) {
            lobby = []
            lobby.push(lobbyId);
            await setLobbyHistory(userId, lobby)
        } else {
            for await (const lobbyID of lobby) {
                if (lobbyId !== lobbyID) {
                    remeinLobbyIds.push(lobbyID);
                }
            }

            remeinLobbyIds.push(lobbyId);
            await setLobbyHistory(userId, remeinLobbyIds)
        }

    } catch (error) {
        logger.error("---- setLobbyHhistory :: ERROR :: ", error);
    }
}

async function getLobby(
    userId: string,
    lobbyId: string,
    gameId: string
) {
    try {
        let lobbyIDs = await getLobbyHistory(userId);
        if (!lobbyIDs) {
            return null;
        } else {
            const lobby = [];

            for await (const lobbyID of lobbyIDs) {
                if (lobbyId === lobbyID) {
                    lobby.push(lobbyID)
                }
            }

            if (lobby.length !== NUMERICAL.ZERO) {
                return lobby[NUMERICAL.ZERO]
            }else{

                for await (const lobbyID of lobbyIDs) {
                    const rejoinHistory: RejoinTableHistoryIf = await getRejoinTableHistory(userId, gameId, lobbyID);
                    if(rejoinHistory){
                        if(!rejoinHistory.isEndGame){

                        }
                    }
                }
            }
        }


    } catch (error) {
        logger.error("---- setLobbyHhistory :: ERROR :: ", error);
    }
}


async function removeLobby() {
    try {

    } catch (error) {
        logger.error("---- removeLobbyHhistory :: ERROR :: ", error);
    }
}

const exportObject = {
    setLobby,
    getLobby,
    removeLobby
}


export = exportObject;