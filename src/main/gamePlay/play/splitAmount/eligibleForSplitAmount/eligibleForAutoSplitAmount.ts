import { MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData } from "../../../cache/Rounds";
import { getTableData } from "../../../cache/Tables";

async function eligibleForAutoSplitAmount(
    playersInfo: UserInfoIf[],
    tableId: string,
    currentRound: number,
) {
    try {
        logger.info("-------------->> eligibleForAutoSplitAmount <<----------------")
        const roundtableData = await getRoundTableData(tableId, currentRound);

        const userIds: string[] = [];

        for await (const player of playersInfo) {
            if (
                player.Status !== PLAYER_STATE.LEFT &&
                player.Status !== PLAYER_STATE.LOST &&
                player.Status !== PLAYER_STATE.DECLARING &&
                player.message !== MESSAGES.MESSAGE.Eliminated
            ) {
                userIds.push(player.userId);
            }
        }

        const gamePoints: number[] = [];
        let poolType: number = NUMERICAL.ZERO;

        for await (const userId of userIds) {
            const player = await getPlayerGamePlay(userId, tableId);
            gamePoints.push(player.gamePoints);
            poolType = player.poolType;
        }
        const split: boolean[] = [];
        logger.info("-------------->> eligibleForAutoSplitAmount :: userIds :: ", userIds)
        if (userIds.length <= NUMERICAL.ONE) {
            return false;
        } else if (roundtableData.splitPlayers > NUMERICAL.THREE) {
            if (userIds.length <= NUMERICAL.THREE && userIds.length > NUMERICAL.ONE) {
                for await (const gamePoint of gamePoints) {
                    if (poolType === NUMERICAL.ONE_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.EIGHTEEN && gamePoint < NUMERICAL.ONE_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else if (poolType === NUMERICAL.TWO_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.ONE_HUNDRED_SEVENTY_FIVE && gamePoint < NUMERICAL.TWO_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else {
                        return false;
                    }
                }
                logger.info("-------------->> eligibleForAutoSplitAmount :: split :: ", split)
                if (split.includes(false)) {
                    return false
                } else if (split.length > NUMERICAL.ONE && !split.includes(false)) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else if (roundtableData.splitPlayers === NUMERICAL.THREE) {

            if (userIds.length === NUMERICAL.TWO) {
                for await (const gamePoint of gamePoints) {
                    if (poolType === NUMERICAL.ONE_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.EIGHTEEN && gamePoint < NUMERICAL.ONE_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else if (poolType === NUMERICAL.TWO_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.ONE_HUNDRED_SEVENTY_FIVE && gamePoint < NUMERICAL.TWO_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else {
                        return false;
                    }
                }
                logger.info("-------------->> eligibleForAutoSplitAmount :: split :: ", split)
                if (split.includes(false)) {
                    return false
                } else if (split.length > NUMERICAL.ONE && !split.includes(false)) {
                    return true;
                } else {
                    return false
                }
            } else {
                return false;
            }
        } else {
            return false;
        }

    } catch (error) {
        logger.error("---- eligibleForAutoSplitAmount :: ERROR ::", error);
        throw error;
    }
}


export = eligibleForAutoSplitAmount;