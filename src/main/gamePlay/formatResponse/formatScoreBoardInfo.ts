import { PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import Errors from "../../errors";
import { formatScoreBoardInfoIf } from "../../interfaces/responseIf";
import { UserInfoIf } from "../../interfaces/scoreBoardIf";
import { responseValidator } from "../../validator";

async function formatScoreBoardInfo(
    tableId: string,
    timer: number,
    trumpCard: string[],
    playersInfo: UserInfoIf[],
    isSplitAmount: boolean,
    message: string,
    isLeaveBtn: boolean
): Promise<formatScoreBoardInfoIf> {
    try {
        const playerScoreBoardInfo: UserInfoIf[] = JSON.parse(JSON.stringify(playersInfo));
        const playersData: UserInfoIf[] = [];

        for (const player of playerScoreBoardInfo) {
            player.gameScore = String(player.gameScore);

            if ("isSwitchTable" in player) {
                delete player.isSwitchTable
            }

            if (player.Status !== PLAYER_STATE.WATCHING) {
                playersData.push(player);
            }
        }

        let resObj: formatScoreBoardInfoIf = {
            tableId: tableId,
            timer: timer,
            message: message,
            trumpCard: trumpCard,
            scoreBoradTable: playersData,
            isSplitAmount: isSplitAmount,
            isLastDeal: false,
            isLeaveBtn: isLeaveBtn
        };
        resObj = await responseValidator.formatScoreBoardInfoValidator(resObj);
        return resObj;
    } catch (error) {
        logger.error("---formatScoreBoardInfo :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatScoreBoardInfo;