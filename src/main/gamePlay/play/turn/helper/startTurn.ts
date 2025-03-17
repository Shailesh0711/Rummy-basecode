import config from "../../../../../connections/config";
import { EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { roundTableIf, userSeatsIf } from "../../../../interfaces/roundTableIf";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { formatStartTurnInfo } from "../../../formatResponse";
import Scheduler from "../../../../scheduler";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import changeturn from "../changeTurn";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import Errors from "../../../../errors";

async function startTurn(tableId: string, userIds: string[], currentRound: number): Promise<void> {
    logger.info("======================>> startTurn <<=========================")
    const { TURN_TIMER } = config()
    try {
        const roundTableData: roundTableIf = await getRoundTableData(tableId, currentRound);
        const turnPlayerUserId = roundTableData.tossWinnerPlayer as string;
        const seats: userSeatsIf = JSON.parse(JSON.stringify(roundTableData.seats))

        // table turn started
        if (roundTableData.tableState === TABLE_STATE.TURN_STARTED) {
            const firtTurnPlayerID = userIds.filter((userID) => {
                return userID === turnPlayerUserId
            })

            // first turn user id
            const firtTurnPlayerId = firtTurnPlayerID[0]
            if (firtTurnPlayerId) {
                const playerData = await getPlayerGamePlay(firtTurnPlayerId, tableId)
                logger.info("----->> startTurn :: playerData ::", playerData);

                // player playing table state are set in card distribution function
                if (playerData.isFirstTurn && playerData.playingStatus === PLAYER_STATE.CARD_DISTRIBUTION && playerData.userStatus === PLAYER_STATE.PLAYING) {
                    const isSeconderyTurnsRemain = playerData.remainSecondryTime > NUMERICAL.ZERO ? true : false;
                    const formatedTturnInfo = await formatStartTurnInfo(firtTurnPlayerId, playerData.seatIndex, -1, TURN_TIMER, true, false, isSeconderyTurnsRemain);
                    logger.info("----->> startTurn :: formatStartTurnInfo ::", formatStartTurnInfo);

                    const currentPlayerData = await getPlayerGamePlay(firtTurnPlayerId, tableId)
                    logger.info("----->> startTurn :: currentPlayerData ::", currentPlayerData);
                    currentPlayerData.isTurn = true;
                    currentPlayerData.updatedAt = new Date();
                    roundTableData.updatedAt = new Date();
                    // use in re-join player
                    roundTableData.currentTurn = playerData.userId;
                    await setRoundTableData(tableId, currentRound, roundTableData);
                    await setPlayerGamePlay(firtTurnPlayerId, tableId, currentPlayerData);
                    commonEventEmitter.emit(EVENTS.USER_TURN_STARTED, {
                        tableId,
                        data: formatedTturnInfo
                    });

                    await Scheduler.addJob.startTurnQueue({
                        tableId,
                        timer: TURN_TIMER * NUMERICAL.THOUSAND,
                        currentTurnPlayerId: firtTurnPlayerId,
                        currentRound: currentRound,
                        currentPlayerSeatIndex: playerData.seatIndex,
                    })
                } else {
                    const nextTurnPlayerId = await changeturn(tableId, turnPlayerUserId, currentRound);
                    logger.info("----->> startTurn :: nextTurnPlayerId ::", nextTurnPlayerId);

                    const nextPlayerData: playerPlayingDataIf = await getPlayerGamePlay(nextTurnPlayerId, tableId)
                    logger.info("----->> startTurn :: nextPlayerData ::", nextPlayerData);

                    roundTableData.firstTurn = true
                    nextPlayerData.isFirstTurn = true;
                    nextPlayerData.isTurn = true;
                    nextPlayerData.updatedAt = new Date();
                    roundTableData.updatedAt = new Date();
                    roundTableData.currentTurn = nextPlayerData.userId;
                    await Promise.all([
                        await setRoundTableData(tableId, currentRound, roundTableData),
                        await setPlayerGamePlay(nextTurnPlayerId, tableId, nextPlayerData)
                    ]);
                    const isSeconderyTurnsRemain = nextPlayerData.remainSecondryTime > NUMERICAL.ZERO ? true : false;
                    const formatedTturnInfo = await formatStartTurnInfo(nextTurnPlayerId, nextPlayerData.seatIndex, -1, TURN_TIMER, true, false, isSeconderyTurnsRemain)
                    logger.info("----->> startTurn :: formatStartTurnInfo ::", formatedTturnInfo);

                    commonEventEmitter.emit(EVENTS.USER_TURN_STARTED, {
                        tableId,
                        data: formatedTturnInfo
                    })

                    await Scheduler.addJob.startTurnQueue({
                        tableId,
                        timer: TURN_TIMER * NUMERICAL.THOUSAND,
                        currentTurnPlayerId: nextTurnPlayerId,
                        currentRound: currentRound,
                        currentPlayerSeatIndex: nextPlayerData.seatIndex,
                    })
                }
            } else {
                // if we cant get first user than change turn
                // const nextTurnPlayerId = await changeturn(turnPlayerUserId, userIds, seats)
                const nextTurnPlayerId = await changeturn(tableId, turnPlayerUserId, currentRound);
                logger.info("----->> startTurn :: nextTurnPlayerId ::", nextTurnPlayerId);

                const nextPlayerData: playerPlayingDataIf = await getPlayerGamePlay(nextTurnPlayerId, tableId)
                logger.info("----->> startTurn :: nextPlayerData ::", nextPlayerData);

                roundTableData.firstTurn = true
                nextPlayerData.isFirstTurn = true;
                nextPlayerData.isTurn = true;
                nextPlayerData.updatedAt = new Date();
                roundTableData.updatedAt = new Date();
                roundTableData.currentTurn = nextPlayerData.userId;
                await Promise.all([
                    await setRoundTableData(tableId, currentRound, roundTableData),
                    await setPlayerGamePlay(nextTurnPlayerId, tableId, nextPlayerData)
                ]);
                const isSeconderyTurnsRemain = nextPlayerData.remainSecondryTime > NUMERICAL.ZERO ? true : false;
                const formatedTturnInfo = await formatStartTurnInfo(nextTurnPlayerId, nextPlayerData.seatIndex, -1, TURN_TIMER, true, false,isSeconderyTurnsRemain);
                logger.info("----->> startTurn :: formatStartTurnInfo ::", formatedTturnInfo);

                commonEventEmitter.emit(EVENTS.USER_TURN_STARTED, {
                    tableId,
                    data: formatedTturnInfo
                })
                await Scheduler.addJob.startTurnQueue({
                    tableId,
                    timer: TURN_TIMER * NUMERICAL.THOUSAND,
                    currentTurnPlayerId: nextTurnPlayerId,
                    currentRound: currentRound,
                    currentPlayerSeatIndex: nextPlayerData.seatIndex,
                })
            }

        } else {
            logger.warn(
                "----->> startTurn :: round turn not started yet !",
                "userIds ::",
                userIds
            );
        }
    } catch (error) {
        logger.error("---startTurn :: ERROR ::", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error)
        } else {
            throw error;
        }
    }
}

export = startTurn;