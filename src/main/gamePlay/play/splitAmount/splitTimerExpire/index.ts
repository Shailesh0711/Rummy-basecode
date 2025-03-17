import config from "../../../../../connections/config";
import { EVENTS, NUMERICAL, PLAYER_STATE, SPLIT_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import timeDifference from "../../../../common/timeDiff";
import commonEventEmitter from "../../../../commonEventEmitter";
import { splitAmountTimerIf } from "../../../../interfaces/schedulerIf";
import { playersSplitAmountDetailsIf } from "../../../../interfaces/splitAmount";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import formatPlayerSplitAmountDetails from "../../../formatResponse/formatPlayerSplitAmountDetails";
import nextRoundStart from "../../rounds/nextRoundStart";
import { getPlayersIds } from "../helper";

async function splitTimerExpire(data: splitAmountTimerIf): Promise<void> {
    const { tableId, currentRound } = data;
    const { SPLIT_AMOUNT_TIMER } = config()
    try {
        logger.info("------------>> splitTimerExpire <<---------------")
        const roundTableData = await getRoundTableData(tableId, currentRound);

        let playersSplitDetails: playersSplitAmountDetailsIf[] = [];

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);

                if (playerData.playingStatus === PLAYER_STATE.SPLIT_AMOUNT) {

                    if (playerData.splitDetails.splitStatus === SPLIT_STATE.PENDING) {
                        const obj = {
                            userId: playerData.userId,
                            amount: playerData.splitDetails.amount,
                            splitStatus: SPLIT_STATE.NO,
                            remainDrops: playerData.splitDetails.drop,
                            socketId: playerData.socketId,
                            userName: playerData.username,
                            gameScore: playerData.gamePoints
                        }
                        playersSplitDetails.push(obj);
                    } else {
                        const obj = {
                            userId: playerData.userId,
                            amount: playerData.splitDetails.amount,
                            splitStatus: playerData.splitDetails.splitStatus,
                            remainDrops: playerData.splitDetails.drop,
                            socketId: playerData.socketId,
                            userName: playerData.username,
                            gameScore: playerData.gamePoints
                        }
                        playersSplitDetails.push(obj);
                    }
                }
            }
        }

        let message = `You Acceped to split prize. but player rejected `;
        let timer = timeDifference(new Date(), roundTableData.updatedAt, SPLIT_AMOUNT_TIMER)

        const formatedRes = await formatPlayerSplitAmountDetails(tableId, message, timer, playersSplitDetails)
        logger.info("----->> splitAmountHandler :: formatPlayerSplitAmountDetails :: ", formatedRes);

        for (const playerInfo of playersSplitDetails) {
            commonEventEmitter.emit(EVENTS.SPLIT_AMOUNT, {
                socket: playerInfo.socketId,
                data: formatedRes
            });
        }

        const userIds = await getPlayersIds(roundTableData.seats);
        for await (const userID of userIds) {
            const playerData = await getPlayerGamePlay(userID, tableId);
            playerData.splitDetails.amount = NUMERICAL.ZERO;
            playerData.splitDetails.splitStatus = SPLIT_STATE.PENDING;
            await setPlayerGamePlay(userID, tableId, playerData);
        }

        roundTableData.isSplit = false;
        await setRoundTableData(tableId, currentRound, roundTableData);

    } catch (error) {
        logger.info("--- splitTimerExpire :: ERROR :: ", error)
    }
}

export = splitTimerExpire;