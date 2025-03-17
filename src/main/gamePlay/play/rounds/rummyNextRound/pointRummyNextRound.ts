import { NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { playingTableIf } from "../../../../interfaces/playingTableIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { removeRoundTableHistory } from "../../../cache/RoundHistory";
import { getRoundTableData } from "../../../cache/Rounds";
import { removeScoreBoardHistory } from "../../../cache/ScoreBoardHistory";
import { removeTurnHistoy } from "../../../cache/TurnHistory";
import { getUser, setUser } from "../../../cache/User";
import { newGameStart } from "../../newGameStart";
import cancelAllTimers from "../../winner/helper/cancelTimers";

export async function pointRummyNextRound(
    tableData: playingTableIf,
    currentRound: number
) {
    try {

        logger.info("------->> pointRummyNextRound :: tableData :: ", tableData);
        const { _id: tableId } = tableData;

        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("---->> pointRummyNextRound :: prevoiusRoundTableData :: roundTableData :: ", roundTableData);


        await cancelAllTimers(tableId, roundTableData.seats, true);

        let winPoints: number = NUMERICAL.ZERO;

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {

                if (roundTableData.seats[seat].userId !== tableData.winner[NUMERICAL.ZERO]) {

                    const player = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);
                    logger.info("------->> pointRummyNextRound :: player :: ", player);
                    logger.info("------->> pointRummyNextRound :: player :: cardPoints :: ", player.cardPoints);

                    winPoints += player.cardPoints

                    const scoreDiff = NUMERICAL.EIGHTEEN - player.cardPoints;
                    logger.info("------->> pointRummyNextRound :: scoreDiff :: ", scoreDiff);

                    if (scoreDiff > NUMERICAL.ZERO) {
                        const userInfo = await getUser(player.userId)
                        logger.info("------->> pointRummyNextRound :: userInfo :: ", userInfo);

                        userInfo.balance += scoreDiff * tableData.bootAmount;
                        await setUser(userInfo.userId, userInfo);
                    }
                }

            }
        }

        logger.info("------->> pointRummyNextRound :: winPoints :: ", winPoints);

        const winnerUserData = await getUser(tableData.winner[NUMERICAL.ZERO]);
        logger.info("------->> pointRummyNextRound :: winnerUserData :: ", winnerUserData);

        winnerUserData.balance += (winPoints + NUMERICAL.EIGHTEEN) * tableData.bootAmount;
        await setUser(winnerUserData.userId, winnerUserData);

        logger.info("------->> pointRummyNextRound :: winnerUserData :: 1 ::", winnerUserData);


        await removeTurnHistoy(tableId);
        await removeRoundTableHistory(tableId);
        await removeScoreBoardHistory(tableId);

        await newGameStart(tableId);
    }
    catch (error) {
        logger.error(`---- pointRummyNextRound :: ERROR :: `, error);
        throw error;
    }
}