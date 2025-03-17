import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { setPlayerGamePlay } from "../../../gamePlay/cache/Players";
import formatDropRoundInfo from "../../../gamePlay/formatResponse/formatDropRoundInfo";
import checkCardSequence from "../../../gamePlay/play/cards/checkCardSequence";
import { cards } from "../../../interfaces/cards";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";

export async function dropUpdateData(
    userId: string,
    tableId: string,
    cutPoints: number,
    playerData: playerPlayingDataIf,
    isDrop = true
): Promise<void> {
    logger.info("------------>> dropUpdateData <<------------------")

    try {
        logger.info("----->> dropUpdateData :: isDrop :: ", isDrop)
        if (isDrop) {
            const currentCards: string[][] = playerData.currentCards;

            const oneGroupCards: string[][] = [[]]
            for await (const cards of currentCards) {
                oneGroupCards[NUMERICAL.ZERO].push(...cards)
            }

            playerData.gamePoints -= cutPoints;
            playerData.cardPoints = cutPoints;
            playerData.roundLostPoint = cutPoints;
            playerData.playingStatus = PLAYER_STATE.DROP_TABLE_ROUND;
            playerData.currentCards = oneGroupCards;
            playerData.dropCutPoint = cutPoints;
            playerData.isDrop = true;

            await setPlayerGamePlay(userId, tableId, playerData);

        } else {
            let resCard: cards[] = [];
            const formatedResponcesForDropTable = await formatDropRoundInfo(userId, tableId, playerData.seatIndex, cutPoints, resCard, false)
            commonEventEmitter.emit(EVENTS.DROP_ROUND, {
                tableId,
                data: formatedResponcesForDropTable
            });
        }
    } catch (error) {
        logger.error("---dropUpdateData :: ERROR: ", error);
        throw error;
    }
}