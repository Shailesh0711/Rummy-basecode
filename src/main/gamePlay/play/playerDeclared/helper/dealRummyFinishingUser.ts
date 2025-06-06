import config from "../../../../../connections/config";
import { EVENTS, MESSAGES, NULL, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { otherPlayersIf } from "../../../../interfaces/schedulerIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { setRoundTableData } from "../../../cache/Rounds";
import formateDeclareInfo from "../../../formatResponse/formateDeclareInfo";
import countTotalPoints from "../../../utils/countTotalPoint";
import getPlayerIdForRoundTable from "../../../utils/getPlayerIdForRoundTable";
import playerplayingStatusUpdate from "../../../utils/playerplayingStatusUpdate";
import turnHistory from "../../History/turnHistory";
import checkCardSequence from "../../cards/checkCardSequence";
import ScoreBoard from "../../scoreBoard/scoreBoad";
import checkRoundWiner from "../../winner/checkRoundWiner";
import Scheduler from "../../../../scheduler";
import { addPointInRoundWinnerPlayer } from "./addPointInRoundWinnerPlayer";
import { getLock } from "../../../../lock";

export async function dealRummyFinishingUser(
    userId: string,
    tableId: string,
    currentRound: number,
    playerData: playerPlayingDataIf,
    roundTableData: roundTableIf
) {
    logger.info("======================>> dealRummyFinishingUser <<=====================");
    const { REMAIN_PLAYERS_FINISH_TIMER } = config();
    let declareFinishingLock = await getLock().acquire([`locks:${tableId}`], 2000);
    try {
        if (
            playerData.playingStatus === PLAYER_STATE.DECLARED &&
            roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START
        ) {
            const Cards = playerData.currentCards;
            const resCard = await checkCardSequence(Cards, playerData, tableId);
            const totalPoints = await countTotalPoints(resCard);

            logger.info(`----->> dealRumyFinishingUser :: Cards ::`, Cards);
            logger.info(`----->> dealRumyFinishingUser :: checkCardSequence ::`, resCard);
            logger.info(`----->> dealRumyFinishingUser :: totalPoints ::`, totalPoints);

            if (totalPoints === NUMERICAL.ZERO) {
                logger.info(`----->> dealRumyFinishingUser :: player validDeaclare round ::`);

                await turnHistory(tableId, roundTableData.turnCount, playerData, currentRound)
                roundTableData.finishDeck = [playerData.finishCard];
                roundTableData.validDeclaredPlayer = playerData.userId;
                roundTableData.validDeclaredPlayerSI = playerData.seatIndex;
                roundTableData.tableState = TABLE_STATE.ROUND_OVER;
                roundTableData.updatedAt = new Date();
                roundTableData.isValidDeclared = true;
                roundTableData.currentTurn = NULL;
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.WIN_ROUND;
                playerData.isTurn = false;
                playerData.isSecondaryTurn = false;
                playerData.playingStatus = PLAYER_STATE.WIN_ROUND;

                await setPlayerGamePlay(userId, tableId, playerData);
                await setRoundTableData(tableId, currentRound, roundTableData);

                // playing player user IDS
                const userIds = await getPlayerIdForRoundTable(tableId, currentRound);

                logger.info(`----->> dealRumyFinishingUser :: userIds ::`, userIds);

                //player state update
                await playerplayingStatusUpdate(tableId, userIds, PLAYER_STATE.DECLARED, true);

                let otherPlayerDeclares: otherPlayersIf[] = [];
                let otherPlayerSocketIds: string[] = [];
                for await (let userID of userIds) {
                    const playerDetail = await getPlayerGamePlay(userID, tableId);
                    const obj = {
                        userId: playerDetail.userId,
                        seatIndex: playerDetail.seatIndex,
                    }
                    otherPlayerDeclares.push(obj);
                    otherPlayerSocketIds.push(playerDetail.socketId);
                }
                logger.info(`----->> dealRumyFinishingUser :: otherPlayerDeclares ::`, otherPlayerDeclares);

                const formatedRes = await formateDeclareInfo(userId, playerData.seatIndex, Number(REMAIN_PLAYERS_FINISH_TIMER), tableId, true, `VALID`, otherPlayerDeclares, [], playerData.gamePoints);

                logger.info(`----->> dealRumyFinishingUser :: formateDeclareInfo ::`, formatedRes);

                commonEventEmitter.emit(EVENTS.DECLARE, {
                    tableId,
                    data: formatedRes
                });

                for await (const socket of otherPlayerSocketIds) {

                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            message: `${MESSAGES.POPUP.MIDDLE_TOAST_POP.PLAYER} ${playerData.username} ${MESSAGES.POPUP.MIDDLE_TOAST_POP.OTHER_FOR_VAILD_SEQUENCE_AND_DECLARE}`,
                        }
                    });
                }
                await addPointInRoundWinnerPlayer(roundTableData, playerData, tableId);
                if (declareFinishingLock) {
                    await getLock().release(declareFinishingLock);
                    declareFinishingLock = null;
                }
                await ScoreBoard(tableId, currentRound, false, false);

                await Scheduler.addJob.RemainPlayersdeclarTimerQueue({
                    timer: REMAIN_PLAYERS_FINISH_TIMER * NUMERICAL.THOUSAND,
                    tableId,
                    currentRound,
                    otherPlayerDeclares
                });
            } else {
                logger.info(`----->> dealRumyFinishingUser :: player Wrong Deaclare round ::`);

                await turnHistory(tableId, roundTableData.turnCount, playerData, currentRound)
                playerData.playingStatus = PLAYER_STATE.WRONG_DECLARED;
                playerData.isSecondaryTurn = false;

                playerData.cardPoints = NUMERICAL.EIGHTEEN;
                playerData.roundLostPoint = NUMERICAL.EIGHTEEN;
                playerData.gamePoints -= NUMERICAL.EIGHTEEN;

                logger.info("----->> dealRumyFinishingUser :: declared :: Before :: currentPlayer :: <<=======", roundTableData.currentPlayer)
                roundTableData.currentPlayer -= 1;
                roundTableData.finishTimerStartPlayerId = NULL;
                roundTableData.opendDeck.push(playerData.finishCard)
                roundTableData.tableState = TABLE_STATE.TURN_STARTED
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus = PLAYER_STATE.WRONG_DECLARED;
                playerData.isDiscardcard = true;

                await setPlayerGamePlay(userId, tableId, playerData);
                await setRoundTableData(tableId, currentRound, roundTableData);

                const formatedRes = await formateDeclareInfo(userId, playerData.seatIndex, 0, tableId, false, `INVALID`, [], roundTableData.opendDeck, playerData.gamePoints + playerData.roundLostPoint);
                logger.info(`----->> dealRumyFinishingUser :: formateDeclareInfo ::`, formatedRes);

                commonEventEmitter.emit(EVENTS.DECLARE, {
                    tableId,
                    data: formatedRes
                });

                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket: playerData.socketId,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
                        title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                        message: MESSAGES.POPUP.CENTER_TOAST_POPUP.INVALAID_DECLARE_POPUP_MESSAGE,
                    }
                });

                logger.info("----->> dealRumyFinishingUser :: declared :: After :: currentPlayer :: <<=======", roundTableData.currentPlayer);

                if (declareFinishingLock) {
                    await getLock().release(declareFinishingLock);
                    declareFinishingLock = null;
                }
                await checkRoundWiner(tableId, userId, currentRound);
            }
        } else {
            logger.warn("----->> dealRumyFinishingUser :: Player can't declare finished deck or player is not turned on")
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: playerData.socketId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.AUTO_DECLARE_FINISHED_MESSAGE,
                }
            })
        }
    } catch (error) {
        logger.info(`--- dealRumyFinishingUser :: ERROR :: `, error);
        throw error;
    } finally {
        if (declareFinishingLock) {
            await getLock().release(declareFinishingLock);
        }
    }
}