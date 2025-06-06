import config from "../../../../../connections/config";
import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { throwErrorIF } from "../../../../interfaces/throwError";
import { getLock } from "../../../../lock";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import formateDeclareInfo from "../../../formatResponse/formateDeclareInfo";
import countTotalPoints from "../../../utils/countTotalPoint";
import getPlayerIdForRoundTable from "../../../utils/getPlayerIdForRoundTable";
import turnHistory from "../../History/turnHistory";
import checkCardSequence from "../../cards/checkCardSequence";
import ScoreBoard from "../../scoreBoard/scoreBoad";
import Scheduler from "../../../../scheduler"

export async function pointRummyRemainPlayerDeclare(
    userId: string,
    tableId: string,
    currentRound: number,
    playerData: playerPlayingDataIf,
    roundTableData: roundTableIf
) {
    logger.info("================>> pointRummyRemainPlayerDeclare <<=====================");
    const { REMAIN_PLAYERS_FINISH_TIMER } = config();
    let declareRemainPlayerLock = await getLock().acquire([`locks:${tableId}`], 2000);
    try {
        if (
            playerData.playingStatus === PLAYER_STATE.DECLARED &&
            roundTableData.tableState === TABLE_STATE.ROUND_OVER &&
            roundTableData.isValidDeclared
        ) {
            let winnerId = "";
            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    if (roundTableData.seats[seat].userId === roundTableData.validDeclaredPlayer) {
                        winnerId = roundTableData.seats[seat].userId;
                        break;
                    }
                }
            }

            const Cards = playerData.currentCards;

            const resCard = await checkCardSequence(Cards, playerData, tableId);
            let totalPoints = await countTotalPoints(resCard);
            await turnHistory(tableId, roundTableData.turnCount, playerData, currentRound)

            if (totalPoints === NUMERICAL.ZERO) {
                totalPoints = NUMERICAL.TWO
            }

            if (roundTableData.firstTurn) {
                totalPoints = totalPoints / NUMERICAL.TWO;
                totalPoints = Number(totalPoints.toFixed(NUMERICAL.TWO));
            }

            logger.info(`----->> autoDeclareRemainPlayers :: Cards ::`, Cards);
            logger.info(`----->> autoDeclareRemainPlayers :: checkCardSequence ::`, resCard);
            logger.info(`----->> autoDeclareRemainPlayers :: totalPoints ::`, totalPoints);

            roundTableData.seats[`s${playerData.seatIndex}`].userStatus = roundTableData.seats[`s${playerData.seatIndex}`].userStatus === PLAYER_STATE.LEFT ? PLAYER_STATE.LEFT : PLAYER_STATE.DECLARED;

            playerData.gamePoints -= totalPoints;
            playerData.roundLostPoint = totalPoints;
            playerData.cardPoints = totalPoints;
            playerData.playingStatus = PLAYER_STATE.DECLARED;
            playerData.isDeclaringState = false;

            await setRoundTableData(tableId, currentRound, roundTableData);
            await setPlayerGamePlay(userId, tableId, playerData);

            // add point in winner Player Data
            const winnerPlayerData = await getPlayerGamePlay(winnerId, tableId);
            logger.info(`----->> autoDeclareRemainPlayers :: winnerPlayerData ::`, winnerPlayerData);

            winnerPlayerData.gamePoints += totalPoints;
            await setPlayerGamePlay(winnerId, tableId, winnerPlayerData);

            const formatedRes = await formateDeclareInfo(userId, playerData.seatIndex, Number(REMAIN_PLAYERS_FINISH_TIMER), tableId, true, `DECLARED`, [], [], totalPoints);

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

            logger.info(`----->> autoDeclareRemainPlayers :: userIds ::`, userIds);

            if (userIds.length === NUMERICAL.ZERO) {
                await Scheduler.cancelJob.RemainPlayersdeclarTimerCancel(tableId);
                await ScoreBoard(tableId, currentRound, false, true);
            }
        } else {
            logger.warn("----->> autoDeclareRemainPlayers :: Round table not over or player not declared in ")
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
        logger.info(`----- dealRummyRemainPlayerDeclare :: ERROR :: `, error);
        throw error;
    } finally {
        if (declareRemainPlayerLock) {
            await getLock().release(declareRemainPlayerLock);
        }
    }
}