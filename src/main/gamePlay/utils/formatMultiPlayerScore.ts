import { NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import { formateScoreIf, playersDataIf } from "../../interfaces/clientApiIf";
import { userSeatsIf } from "../../interfaces/roundTableIf";
import { getTableData } from "../cache/Tables";


export async function formatMultiPlayerScore(
    tableId: string,
    lobbyId: string,
    playersData: formateScoreIf[]
) {
    try {
        const tableData = await getTableData(tableId);
        logger.info("------>> formatMultiPlayerScore :: tableData :: ", tableData);

        playersData = playersData.sort((a, b) => {
            let x = Number(a.score);
            let y = Number(b.score);
            return y - x;
        });

        const playersInfoWithRank: formateScoreIf[] = [];
        let rankCount = NUMERICAL.ONE;
        for await (const player of playersData) {
            if (player.winLossStatus === "Win") {
                player.rank = String(rankCount);
                playersInfoWithRank.push(player);
                rankCount += NUMERICAL.ONE;
            }
        }
        for await (const player of playersData) {
            if (player.winLossStatus === "Tie") {
                player.rank = String(rankCount);
                playersInfoWithRank.push(player);
                rankCount += NUMERICAL.ONE;
            }
        }
        for await (const player of playersData) {
            if (player.winLossStatus === "Loss") {
                player.rank = String(rankCount);
                playersInfoWithRank.push(player);
                rankCount += NUMERICAL.ONE;
            }
        }

        return {
            tableId,
            tournamentId: lobbyId,
            startGameTime : tableData.startGameTime,
            endGameTime : new Date(),
            playersScore: playersInfoWithRank
        }

    } catch (error) {
        logger.info(`--- formatMultiPlayerScore :: ERROR ::`, error);
        throw error;
    }
}