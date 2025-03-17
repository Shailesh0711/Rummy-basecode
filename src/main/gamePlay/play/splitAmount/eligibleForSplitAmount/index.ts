import { MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData } from "../../../cache/Rounds";

async function eligibleForSplitAmount(
    tableId: string,
    currentRound: number,
    playersInfo: UserInfoIf[]
) {
    try {

        const roundtableData = await getRoundTableData(tableId, currentRound);

        const userIds: string[] = []
        for await (const player of playersInfo) {
            if (
                player.Status !== PLAYER_STATE.DECLARING &&
                player.Status !== PLAYER_STATE.LEFT &&
                player.Status !== PLAYER_STATE.LOST &&
                player.message !== MESSAGES.MESSAGE.Eliminated
            ) {
                userIds.push(player.userId)
            }
        }

        const gamePoints: number[] = [];
        let poolType: number = NUMERICAL.ZERO;
        for await (const userId of userIds) {
            const player = await getPlayerGamePlay(userId, tableId);
            gamePoints.push(player.gamePoints);
            poolType = player.poolType;
        }

        if (roundtableData.totalPlayers === NUMERICAL.ONE) {
            return false;
        } else if (roundtableData.splitPlayers > NUMERICAL.THREE) {
            if (userIds.length <= NUMERICAL.THREE && userIds.length > NUMERICAL.ONE) {

                const split: boolean[] = []
                for await (const gamePoint of gamePoints) {
                    if (poolType === NUMERICAL.ONE_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.SIXTY && gamePoint < NUMERICAL.ONE_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else if (poolType === NUMERICAL.TWO_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.ONE_HUNDRED_FIFTY_ONE && gamePoint < NUMERICAL.TWO_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else {
                        return false;
                    }
                }

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
        } else if (roundtableData.splitPlayers === NUMERICAL.THREE) {
            if (userIds.length < NUMERICAL.THREE && userIds.length > NUMERICAL.ONE) {
                const split: boolean[] = [];
                for await (const gamePoint of gamePoints) {
                    if (poolType === NUMERICAL.ONE_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.SIXTY && gamePoint < NUMERICAL.ONE_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else if (poolType === NUMERICAL.TWO_HUNDRED_ONE) {
                        if (gamePoint > NUMERICAL.ONE_HUNDRED_FIFTY_ONE && gamePoint < NUMERICAL.TWO_HUNDRED_ONE) {
                            split.push(true)
                        }
                        else {
                            split.push(false)
                        }
                    } else {
                        return false;
                    }
                }
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
        } else {
            return false;
        }



    } catch (error) {
        logger.error("--- eligibleForSplitAmount :: ERROR :: ", error);
        throw error;
    }
}

export = eligibleForSplitAmount;