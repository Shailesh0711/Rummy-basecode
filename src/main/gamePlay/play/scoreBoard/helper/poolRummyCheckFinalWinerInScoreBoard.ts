import { MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getTableData } from "../../../cache/Tables";


export async function poolRummyCheckFinalWinerInScoreBoard(
    playersInfo: UserInfoIf[]
): Promise<{
    isFinalWinner: boolean;
    winAmount: number;
}> {
    try {
        let count: number = NUMERICAL.ZERO;
        let eliminatedPlayerCount: number = NUMERICAL.ZERO;
        for await (const player of playersInfo) {

            if (
                player.message === MESSAGES.MESSAGE.Eliminated ||
                player.Status === PLAYER_STATE.LEFT ||
                player.Status === PLAYER_STATE.LOST
            ) {
                eliminatedPlayerCount += NUMERICAL.ONE;
            }
            else if (
                player.message !== MESSAGES.MESSAGE.Eliminated
            ) {
                count += NUMERICAL.ONE;
            }

        }

        if ((eliminatedPlayerCount === playersInfo.length - NUMERICAL.ONE) && count === NUMERICAL.ONE) {
            const tableData = await getTableData(playersInfo[NUMERICAL.ZERO].tableId);
            return {
                isFinalWinner: true,
                winAmount: tableData.winPrice
            };
        }

        return {
            isFinalWinner: false,
            winAmount: NUMERICAL.MINUS_ONE
        };
    } catch (error) {
        logger.error(`--- poolRummyCheckFinalWinerInScoreBoard :: ERROR :: `, error);
        throw error;
    }
}