import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { startTurnTimerQueueIf } from "../../../interfaces/schedulerIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import formatStartTurnInfo from "../../formatResponse/formatStartTurnInfo";
import changeturn from "./changeTurn";
import Scheduler from "../../../scheduler";
import config from "../../../../connections/config";
import Errors from "../../../errors"
import { turnHistory } from "../History";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getLock } from "../../../lock";
import { cardNotDiscardCard, cardNotPickUp,  reShuffleCardCloseDeck } from "./helper/nextTurnHelper";
// import { nextTurnHelper } from "./helper/nextTurnHelper";

export async function nextPlayerTurn(
    data: startTurnTimerQueueIf
): Promise<void> {
    logger.info("===========>> nextPlayerTurn <<==============");
    const { tableId, currentTurnPlayerId, currentRound, currentPlayerSeatIndex } = data;
    const { TURN_TIMER } = config();
    let newNextPlayerTurnLocks = null;
    let nextPlayerTurnLocks = await getLock().acquire([`locks:${tableId}:${currentTurnPlayerId}`, `locks:${tableId}`], 5000);
    try {
        logger.info("----->> nextPlayerTurn :: tableId :: ", tableId)
        logger.info("----->> nextPlayerTurn :: turn over player userId :: ", currentTurnPlayerId);
        logger.info("----->> nextPlayerTurn :: turn over player Index :: ", currentPlayerSeatIndex);
        let roundTableData = await getRoundTableData(tableId, currentRound);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.NEXT_PLAYER_CHANGE_TURN_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> nextPlayerTurn :: roundTableData :: ", roundTableData);

        const nextTurnPlayerId = await changeturn(tableId, currentTurnPlayerId, currentRound);
        logger.info("----->> nextPlayerTurn :: nextTurnPlayerId :: ", nextTurnPlayerId)

        const nextPlayerData = await getPlayerGamePlay(nextTurnPlayerId, tableId);
        if (nextPlayerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.NEXT_PLAYER_CHANGE_TURN_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> nextPlayerTurn :: nextPlayerData :: ", nextPlayerData)

        let currentPlayerData = await getPlayerGamePlay(currentTurnPlayerId, tableId);
        if (currentPlayerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.NEXT_PLAYER_CHANGE_TURN_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> nextPlayerTurn :: turn Over Player Data :: ", currentPlayerData)

        roundTableData.turnCount += 1;
        roundTableData.isSecondaryTurn = false;

        // if close deck card all open than re-shuffle
        if (roundTableData.closedDeck.length === NUMERICAL.MINUS_ONE) {
            // lock release 
            if (nextPlayerTurnLocks) {
                await getLock().release(nextPlayerTurnLocks);
                nextPlayerTurnLocks = null;
            }
            nextPlayerTurnLocks = null;
            await reShuffleCardCloseDeck(
                tableId,
                currentRound,
                currentTurnPlayerId,
                currentPlayerSeatIndex,
                roundTableData
            )
        } else {
            let isPlayerLeft = false;                      // if player all remain turn Zero then true;
            // if card not pick up
            if (!currentPlayerData.isCardPickUp && !currentPlayerData.isDrop) {
                logger.info("----->> nextPlayerTurn :: card not pickup :: ");
                if (roundTableData.seats[`s${currentPlayerData.seatIndex}`].userStatus === PLAYER_STATE.PLAYING) {

                    if (nextPlayerTurnLocks) {
                        await getLock().release(nextPlayerTurnLocks);
                        nextPlayerTurnLocks = null;
                    }
                    nextPlayerTurnLocks = null;
                    const cardNotPickUpData = await cardNotPickUp(
                        currentPlayerData,
                        tableId,
                    );
                    currentPlayerData = cardNotPickUpData.currentPlayerData
                    isPlayerLeft = cardNotPickUpData.isLeft
                }
            }
            // if card not discard 
            else if (!currentPlayerData.isDiscardcard && currentPlayerData.isCardPickUp) {
                logger.info("----->> nextPlayerTurn :: player card pickup but not discard card :: ")

                const resObj = await cardNotDiscardCard(
                    currentPlayerData,
                    roundTableData,
                    currentRound
                )
                roundTableData = resObj.roundTableInfo;
                currentPlayerData = resObj.currentPlayerData;
            }

            if (!roundTableData.isDropOrLeave) {
                await turnHistory(tableId, roundTableData.turnCount, currentPlayerData, currentRound);
            }

            // use in re-join player
            roundTableData.currentTurn = nextTurnPlayerId;

            roundTableData.updatedAt = new Date();
            roundTableData.isDropOrLeave = false;
            roundTableData.isSecondaryTurn = false;
            roundTableData.firstTurn = false;

            currentPlayerData.isTurn = false;
            currentPlayerData.isDiscardcard = false;
            currentPlayerData.isCardPickUp = false;
            currentPlayerData.isSecondaryTurn = false;

            logger.info("----->> nextPlayerTurn :: currentPlayerData :: after chang ::: ", currentPlayerData)

            if (!isPlayerLeft) {
                await setPlayerGamePlay(currentTurnPlayerId, tableId, currentPlayerData);
                await setRoundTableData(tableId, currentRound, roundTableData);
            }
            if (
                nextPlayerData.userStatus === PLAYER_STATE.PLAYING &&
                nextPlayerData.playingStatus === PLAYER_STATE.CARD_DISTRIBUTION &&
                !isPlayerLeft
            ) {

                let newNextPlayerTurnLocks = await getLock().acquire([`locks:${nextTurnPlayerId}`], 2000);
                try {
                    const nextPlayerDataInfo = await getPlayerGamePlay(nextTurnPlayerId, tableId);
                    logger.info("----->> nextPlayerTurn :: nextPlayerDataInfo :: ", nextPlayerDataInfo)

                    nextPlayerDataInfo.isTurn = true;
                    nextPlayerDataInfo.updatedAt = new Date();
                    roundTableData.isSecondaryTurn = false;
                    roundTableData.updatedAt = new Date();
                    roundTableData.isPickUpFromOpenDeck = true;
                    // use in re-join player
                    roundTableData.currentTurn = nextTurnPlayerId;

                    await setRoundTableData(tableId, currentRound, roundTableData);
                    await setPlayerGamePlay(nextTurnPlayerId, tableId, nextPlayerDataInfo);

                    const isSeconderyTurnsRemain = nextPlayerDataInfo.remainSecondryTime > NUMERICAL.ZERO ? true : false;

                    const formatedTturnInfo = await formatStartTurnInfo(
                        nextTurnPlayerId,
                        nextPlayerData.seatIndex,
                        currentPlayerSeatIndex,
                        TURN_TIMER,
                        false,
                        false,
                        isSeconderyTurnsRemain
                    )
                    logger.info("----->> nextPlayerTurn :: formatStartTurnInfo :: ", formatedTturnInfo)
                    commonEventEmitter.emit(EVENTS.USER_TURN_STARTED, {
                        tableId,
                        data: formatedTturnInfo
                    });
                    if (newNextPlayerTurnLocks) {
                        await getLock().release(newNextPlayerTurnLocks);
                        newNextPlayerTurnLocks = null;
                    }
                    if (nextPlayerTurnLocks) {
                        await getLock().release(nextPlayerTurnLocks);
                        nextPlayerTurnLocks = null;
                    }
                    await Scheduler.addJob.startTurnQueue({
                        tableId,
                        timer: TURN_TIMER * NUMERICAL.THOUSAND,
                        currentTurnPlayerId: nextTurnPlayerId,
                        currentRound: currentRound,
                        currentPlayerSeatIndex: nextPlayerData.seatIndex
                    });
                } catch (error) {
                    logger.error("---nextPlayerTurn :: ERROR :: 00 :: ", error);
                }
            } else {
                logger.warn("----->> nextPlayerTurn :: player state is not playing or cards not distribute this player")
                // commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                //     socket: nextPlayerData.socketId,
                //     data: {
                //         isPopup: true,
                //         popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                //         title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                //         message: MESSAGES.POPUP.MIDDLE_TOAST_POP.NEXT_PLAYER_TURN_MESSAGE,
                //     }
                // })
            }
        }
    } catch (error: any) {
        logger.error("---nextPlayerTurn :: ERROR: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- nextPlayerTurn :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                tableId,
                "userId :: ",
                data.currentTurnPlayerId
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE ?
                        MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE : MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            })
        } else if (error && error.type === ERROR_TYPE.NEXT_PLAYER_CHANGE_TURN_ERROR) {
            logger.error(
                `--- cardSortHandler :: ERROR_TYPE :: ${ERROR_TYPE.NEXT_PLAYER_CHANGE_TURN_ERROR}::`,
                error,
                "userId :: ",
                data.currentTurnPlayerId
            );
            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        } else {
            logger.error(
                "--- nextPlayerTurn :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.CHANGE_TURN_ON_ERROR,
                    message: error && error.message && typeof error.message === 'string'
                        ? error.message
                        : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        }
    } finally {
        if (newNextPlayerTurnLocks) {
            await getLock().release(newNextPlayerTurnLocks);
            newNextPlayerTurnLocks = null;
        }
        if (nextPlayerTurnLocks) {
            await getLock().release(nextPlayerTurnLocks);
            nextPlayerTurnLocks = null;
        }
    }
}
