import config from "../../../../../connections/config";
import { ERROR_TYPE, MESSAGES, NUMERICAL, PLAYER_STATE, SPLIT_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { playersSplitAmountDetailsIf } from "../../../../interfaces/splitAmount";
import { throwErrorIF } from "../../../../interfaces/throwError";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData } from "../../../cache/Rounds";
import { getTableData } from "../../../cache/Tables";
import { getPlayersIds } from "../helper";
import Errors from "../../../../errors";

async function amountSplitDetails(
    tableId: string,
    currentRound: number,
    isAutoSplit: boolean
): Promise<playersSplitAmountDetailsIf[]> {
    logger.info("------------------->> amountSplitDetails <<-----------------------");
    try {
        const tableData = await getTableData(tableId)
        const roundTableData = await getRoundTableData(tableId, currentRound);

        logger.info(
            `----->> amountSplitDetails :: tableId :: ${tableId} :: currentRound :: ${currentRound} :: isAutoSplit :: ${isAutoSplit} `
        );
        if (tableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.SPLIT_AMOUNT_ERROR,
                message: MESSAGES.ERROR.TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> amountSplitDetails :: tableData :: ", tableData);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.SPLIT_AMOUNT_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> amountSplitDetails :: roundTableData :: ", roundTableData);

        const userIds = await getPlayersIds(roundTableData.seats);
        logger.info("----->> amountSplitDetails :: userIds :: ", userIds);

        let totalSplitAmount = NUMERICAL.ZERO;
        let playersDetails: { userId: string }[] = [];
        let playersSplitDetails: playersSplitAmountDetailsIf[] = []

        for await (const userId of userIds) {
            const playerData = await getPlayerGamePlay(userId, tableId);
            if (
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LEFT &&
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.LOST &&
                roundTableData.seats[`s${playerData.seatIndex}`].userStatus !== PLAYER_STATE.DISCONNECT
            ) {
                if (playerData.poolType === NUMERICAL.ONE_HUNDRED_ONE) {
                    if (playerData.gamePoints < NUMERICAL.ONE_HUNDRED_ONE) {
                        const obj = {
                            userId: userId,
                        }
                        playersDetails.push(obj)

                    }
                } else if (playerData.poolType === NUMERICAL.TWO_HUNDRED_ONE) {
                    if (playerData.gamePoints < NUMERICAL.TWO_HUNDRED_ONE) {
                        const obj = {
                            userId: userId
                        }
                        playersDetails.push(obj)
                    }
                }
            }
        }

        for await (const player of playersDetails) {

            const playerData = await getPlayerGamePlay(player.userId, tableId)
            playerData.playingStatus = PLAYER_STATE.SPLIT_AMOUNT
            playerData.updatedAt = new Date();
            let dropCounter_Cal: number = NUMERICAL.ZERO
            if (isAutoSplit) {
                playerData.splitDetails.splitStatus = SPLIT_STATE.YES
                playerData.splitDetails.amount += Number((tableData.winPrice / playersDetails.length).toFixed(NUMERICAL.TWO));
            } else {
                dropCounter_Cal = Math.trunc((playerData.refrensDropsCountPoint - playerData.gamePoints) / playerData.firstDropCutPoints);
                playerData.splitDetails.amount = Number((dropCounter_Cal * tableData.bootAmount * (NUMERICAL.ONE - (tableData.rake / NUMERICAL.HUNDRED))).toFixed(2));
                playerData.splitDetails.drop = dropCounter_Cal;
            }
            await setPlayerGamePlay(player.userId, tableId, playerData);

            totalSplitAmount += playerData.splitDetails.amount;

            logger.info("----->> amountSplitDetails :: playerData.splitDetails.amount :: 1 :: ", playerData.splitDetails.amount);
            const obj = {
                userId: playerData.userId,
                amount: playerData.splitDetails.amount,
                splitStatus: isAutoSplit ? SPLIT_STATE.YES : playerData.splitDetails.splitStatus,
                remainDrops: dropCounter_Cal,
                socketId: playerData.socketId,
                userName: playerData.username,
                gameScore: playerData.gamePoints
            }
            playersSplitDetails.push(obj);
        }

        logger.info("----->> amountSplitDetails :: playersSplitDetails :: 1 ::", playersSplitDetails);

        if (totalSplitAmount < tableData.winPrice && !isAutoSplit) {
            logger.info("----->> amountSplitDetails :: totalSplitAmount :: ", totalSplitAmount);
            const remainAmount = Number((tableData.winPrice - totalSplitAmount).toFixed(NUMERICAL.TWO));
            const remainSplitAmount = Number((remainAmount / playersDetails.length).toFixed(NUMERICAL.TWO));

            logger.info("----->> amountSplitDetails :: remainAmount :: ", remainAmount);
            logger.info("----->> amountSplitDetails :: remainSplitAmount :: ", remainSplitAmount);

            if (remainAmount >= (tableData.bootAmount * (NUMERICAL.ONE - (tableData.rake / NUMERICAL.HUNDRED)))) {
                playersSplitDetails = [];
                for await (const player of playersDetails) {
                    const playerData = await getPlayerGamePlay(player.userId, tableId);

                    playerData.splitDetails.amount += Number(remainSplitAmount.toFixed(NUMERICAL.TWO));
                    playerData.splitDetails.amount = Number(playerData.splitDetails.amount.toFixed(NUMERICAL.TWO))
                    logger.info("----->> amountSplitDetails :: playerData.splitDetails.amount :: 2 :: ", playerData.splitDetails.amount);

                    await setPlayerGamePlay(player.userId, tableId, playerData);
                    const obj = {
                        userId: player.userId,
                        amount: playerData.splitDetails.amount,
                        splitStatus: isAutoSplit ? SPLIT_STATE.YES : playerData.splitDetails.splitStatus,
                        remainDrops: playerData.splitDetails.drop,
                        socketId: playerData.socketId,
                        userName: playerData.username,
                        gameScore: playerData.gamePoints
                    }
                    playersSplitDetails.push(obj);
                }
                logger.info("----->> amountSplitDetails :: playersSplitDetails :: 2 ::", playersSplitDetails);
            }
        }

        return playersSplitDetails

    } catch (error: any) {
        console.log("--- amountSplitValue :: ERROR ::", error)
        logger.error("--- amountSplitValue :: ERROR ::", error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- amountSplitValue :: CancelBattle :: ERROR ::",
                error,
                `tableId :: ${tableId}`
            );
            nonProdMsg = "CancelBattle";
            throw new Errors.CancelBattle(error)
        } else if (error && error.type === ERROR_TYPE.SPLIT_AMOUNT_ERROR) {
            logger.error(
                `--- amountSplitValue :: ERROR_TYPE :: ${ERROR_TYPE.SPLIT_AMOUNT_ERROR}::`,
                error,
                `tableId : ${tableId}`
            );
            throw error;
        } else {
            logger.error(
                "--- amountSplitValue :: commonError :: ERROR ::",
                error,
                `tableId :: ${tableId}`
            );
            throw error;
        }
    }
}

export = amountSplitDetails;