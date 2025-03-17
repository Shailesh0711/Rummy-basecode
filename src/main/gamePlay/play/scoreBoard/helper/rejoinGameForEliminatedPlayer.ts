import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { setRoundTableData } from "../../../cache/Rounds";
import { getTableData } from "../../../cache/Tables";
import { getUser } from "../../../cache/User";
import Scheduler from "../../../../scheduler"
import config from "../../../../../connections/config";

export async function rejoinGameForEliminatedPlayer(
    playersInfo: UserInfoIf[],
    autoSplit: boolean,
    isWinner: boolean
) {

    logger.info("------>> rejoinGameForEliminatedPlayer :: playersInfo :: ", playersInfo);
    logger.info("------>> rejoinGameForEliminatedPlayer :: autoSplit :: ", autoSplit);

    try {
        if (autoSplit || isWinner || playersInfo.length < NUMERICAL.THREE) {
            return false;
        }

        const playersGameScore: number[] = [];
        let poolType: number = NUMERICAL.ZERO;
        let eliminatedPlayerCount: number = NUMERICAL.ZERO;
        let tableId = ``;

        for await (const player of playersInfo) {
            if (
                player.Status !== PLAYER_STATE.LEFT &&
                player.Status !== PLAYER_STATE.LOST &&
                player.message !== MESSAGES.MESSAGE.Eliminated
            ) {
                playersGameScore.push(Number(player.gameScore))
                poolType = player.poolType as number;
                tableId = player.tableId;
            }

            if (
                player.message === MESSAGES.MESSAGE.Eliminated &&
                player.Status !== PLAYER_STATE.LEFT &&
                player.Status !== PLAYER_STATE.LOST
            ) {
                eliminatedPlayerCount += NUMERICAL.ONE;
            }
        }

        if (eliminatedPlayerCount === NUMERICAL.ZERO) {
            return false;
        }

        logger.info("------>> rejoinGameForEliminatedPlayer :: playersGameScore :: ", playersGameScore);

        const maxGameScore: number = Math.max(...playersGameScore);

        if (poolType === NUMERICAL.ONE_HUNDRED_ONE) {

            if (maxGameScore > NUMERICAL.SEVENTY_NINE) {
                return false;
            }

        } else if (poolType === NUMERICAL.TWO_HUNDRED_ONE) {

            if (maxGameScore > NUMERICAL.ONE_HUNDRED_SEVENTY_FOUR) {
                return false;
            }

        } else {
            return false;
        }

        return true;

    } catch (error) {
        logger.error(`---- rejoinGameForEliminatedPlayer :: ERROR :: `, error);
        throw error;
    }
}


export async function rejoinPopupSend(
    tableId: string,
    playersInfo: UserInfoIf[],
    roundTableData: roundTableIf,
    currentRound: number
) {
    const { REJOINT_GAME_POPUP_TIMER } = config();
    try {
        let eliminatedPlayerCount: number = NUMERICAL.ZERO;

        const tableData = await getTableData(tableId)
        logger.info("------>> rejoinGameForEliminatedPlayer :: tableData :: ", tableData);

        const { gamePoolType } = tableData;
        const playersGameScore: number[] = [];

        for await (const player of playersInfo) {
            if (
                player.Status !== PLAYER_STATE.LEFT &&
                player.Status !== PLAYER_STATE.LOST &&
                player.message !== MESSAGES.MESSAGE.Eliminated
            ) {
                playersGameScore.push(Number(player.gameScore))
            }
        }

        logger.info("------>> rejoinGameForEliminatedPlayer :: playersGameScore :: ", playersGameScore);

        const maxGameScore: number = Math.max(...playersGameScore);
        const userIds: string[] = []

        for await (const player of playersInfo) {
            if (player.message === MESSAGES.MESSAGE.Eliminated) {
                userIds.push(player.userId);

                eliminatedPlayerCount += NUMERICAL.ONE;

                const userData = await getUser(player.userId);
                logger.info("------>> rejoinGameForEliminatedPlayer :: userData :: ", userData);

                const playerData = await getPlayerGamePlay(player.userId, tableId)
                logger.info("------>> rejoinGameForEliminatedPlayer :: playerData :: ", playerData);

                playerData.isWaitingForRejoinPlayer = true;
                playerData.updatedAt = new Date();

                await setPlayerGamePlay(playerData.userId, tableId, playerData);

                commonEventEmitter.emit(EVENTS.REJOIN_GAME_AGAIN, {
                    socket: playerData.socketId,
                    data: {
                        title: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_TITLE}`,
                        message: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_FIRST_MESSAGE} ${maxGameScore + NUMERICAL.ONE} pts?`,
                        middleMessage: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_MIDDLE_MESSAGE}${userData.balance.toFixed(2)}`,
                        lastMessage: `${MESSAGES.MESSAGE.REJOIN_GAME_POPUP_LAST_MESSAGE}${tableData.bootAmount.toFixed(2)}`,
                        timer: REJOINT_GAME_POPUP_TIMER
                    }
                });

            }
        }
        roundTableData.isEligibleForSplit = false;

        roundTableData.isWaitingForRejoinPlayer = true;
        roundTableData.eliminatedPlayers = userIds;
        roundTableData.roundMaxPoint = maxGameScore;

        await setRoundTableData(tableId, currentRound, roundTableData);

        await Scheduler.addJob.RejoinGamePopupQueue({
            timer: REJOINT_GAME_POPUP_TIMER * NUMERICAL.THOUSAND,
            tableId: tableId,
            playersId: userIds,
            currentRound
        })

    } catch (error) {
        logger.error(`--- rejoinPopupSend :: ERROR :: `, error);
        throw error;
    }
}
