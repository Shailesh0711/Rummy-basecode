import { PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { playerInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay } from "../../../cache/Players";


async function nextRoundPlayersInfo(
    userIds: string[],
    tableId: string,
): Promise<playerInfoIf[]> {
    logger.info("--------->> nextRoundPlayersInfo <<----------")
    try {
        logger.info("--->> nextRoundPlayersInfo :: userIds :: ", userIds)
        logger.info("--->> nextRoundPlayersInfo :: tableId :: ", tableId)

        let playersInfo: playerInfoIf[] = [];

        for await (let userId of userIds) {
            const playerData = await getPlayerGamePlay(userId, tableId);
            if (playerData && playerData.userStatus === PLAYER_STATE.PLAYING) {

                if (
                    playerData.playingStatus === PLAYER_STATE.PLAYING ||
                    playerData.playingStatus === PLAYER_STATE.DROP_TABLE_ROUND ||
                    playerData.playingStatus === PLAYER_STATE.WIN_ROUND ||
                    playerData.playingStatus === PLAYER_STATE.WRONG_DECLARED ||
                    playerData.playingStatus === PLAYER_STATE.CARD_DISTRIBUTION ||
                    playerData.playingStatus === PLAYER_STATE.DECLARED 
                ) {
                    const obj = {
                        userId: playerData.userId,
                        seatIndex: playerData.seatIndex,
                        gameScore: playerData.gamePoints,
                        Status: playerData.playingStatus,
                        dealType: playerData.dealType,
                        poolType: playerData.poolType,
                        socketId : playerData.socketId,
                    };
                    playersInfo.push(obj);
                }
            }
        }
        logger.info("--->> nextRoundPlayersInfo :: playersInfo :: ", playersInfo)
        return playersInfo;
    } catch (error) {
        logger.error("--nextRoundPlayersInfo :: ERROR :: ", error);
        throw error;
    }
}

export = nextRoundPlayersInfo;