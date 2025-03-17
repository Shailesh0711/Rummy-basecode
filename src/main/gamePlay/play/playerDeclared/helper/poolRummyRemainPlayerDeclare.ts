import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { setPlayerGamePlay } from "../../../cache/Players";
import { setRoundTableData } from "../../../cache/Rounds";
import formateDeclareInfo from "../../../formatResponse/formateDeclareInfo";
import countTotalPoints from "../../../utils/countTotalPoint";
import getPlayerIdForRoundTable from "../../../utils/getPlayerIdForRoundTable";
import turnHistory from "../../History/turnHistory";
import checkCardSequence from "../../cards/checkCardSequence";
import ScoreBoard from "../../scoreBoard/scoreBoad";
import Scheduler from "../../../../scheduler";
import config from "../../../../../connections/config";
import { getLock } from "../../../../lock";

export async function poolRummyRemainPlayerDeclare(
    userId: string,
    tableId: string,
    currentRound: number,
    playerData: playerPlayingDataIf,
    roundTableData: roundTableIf
) {
    logger.info("================>> poolRummyRemainPlayerDeclare <<=====================");
    const { REMAIN_PLAYERS_FINISH_TIMER } = config();
    let declareRemainPlayerLock = await getLock().acquire([`locks:${tableId}`], 2000);
    try {
        if (
            playerData.playingStatus === PLAYER_STATE.DECLARED &&
            roundTableData.tableState === TABLE_STATE.ROUND_OVER &&
            roundTableData.isValidDeclared
        ) {
            const Cards = playerData.currentCards;

            const resCard = await checkCardSequence(Cards, playerData, tableId);
            let totalPoints = await countTotalPoints(resCard, playerData.poolType);
            await turnHistory(tableId, roundTableData.turnCount, playerData, currentRound)

            if (totalPoints === NUMERICAL.ZERO) {
                totalPoints = NUMERICAL.TWO
            }

            logger.info(`----->> poolRummyRemainPlayerDeclare :: Cards ::`, Cards);
            logger.info(`----->> poolRummyRemainPlayerDeclare :: checkCardSequence ::`, resCard);
            logger.info(`----->> poolRummyRemainPlayerDeclare :: totalPoints ::`, totalPoints);

            roundTableData.seats[`s${playerData.seatIndex}`].userStatus = roundTableData.seats[`s${playerData.seatIndex}`].userStatus === PLAYER_STATE.LEFT ? PLAYER_STATE.LEFT : PLAYER_STATE.DECLARED;

            if (playerData.poolType === NUMERICAL.SIXTY_ONE) {
                if (totalPoints > NUMERICAL.SIXTY) {
                    playerData.gamePoints += 60;
                    totalPoints = 60;
                } else {
                    playerData.gamePoints += totalPoints;
                }
            } else {
                playerData.gamePoints += totalPoints;
            }

            playerData.cardPoints = totalPoints;
            playerData.roundLostPoint = totalPoints;
            playerData.playingStatus = PLAYER_STATE.DECLARED;
            playerData.isDeclaringState = false;

            await setRoundTableData(tableId, currentRound, roundTableData);
            await setPlayerGamePlay(userId, tableId, playerData);

            const formatedRes = await formateDeclareInfo(userId, playerData.seatIndex, Number(REMAIN_PLAYERS_FINISH_TIMER), tableId, true, `Declared`, [], [], playerData.gamePoints - playerData.roundLostPoint);

            commonEventEmitter.emit(EVENTS.DECLARE, {
                tableId,
                data: formatedRes
            });

            if (declareRemainPlayerLock) {
                await getLock().release(declareRemainPlayerLock);
                declareRemainPlayerLock = null;
            }

            await ScoreBoard(tableId, currentRound, false, false, userId);

            const userIds = await getPlayerIdForRoundTable(tableId, currentRound);

            logger.info(`----->> poolRummyRemainPlayerDeclare :: userIds ::`, userIds);

            if (userIds.length === NUMERICAL.ZERO) {
                await Scheduler.cancelJob.RemainPlayersdeclarTimerCancel(tableId);
                await ScoreBoard(tableId, currentRound, false, true);
            }
        } else {
            logger.warn("----->> poolRummyRemainPlayerDeclare :: Round table not over or player not declared in ")
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: playerData.socketId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.AUTO_DECLARE_REMAIN_PLAYERS_MESSAGE,
                }
            });
        }
    } catch (error) {
        logger.info(`----- poolRummyRemainPlayerDeclare :: ERROR :: `, error);
        throw error;
    } finally {
        if (declareRemainPlayerLock) {
            await getLock().release(declareRemainPlayerLock);
        }
    }
}