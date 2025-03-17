import { getUser, setUser } from "../../cache/User";
import Errors from "../../../errors"
import { getTableData } from "../../cache/Tables";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../../constants";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import commonEventEmitter from "../../../commonEventEmitter";
import { formatBootCollectionInfo } from "../../formatResponse";
import { throwErrorIF } from "../../../interfaces/throwError";
import logger from "../../../../logger";
const _ = require("underscore");

async function bootCollect(
    tableId: string,
    currentRound: number,
) {
    logger.info("================>> bootCollect <<====================")
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.BOOT_COLLECTION_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> bootCollect :: roundTableData :: ", roundTableData);
        let isSendArrangeSeats: boolean = false;
        let isCountiusGame: boolean = false;

        if (NUMERICAL.TWO <= roundTableData.totalPlayers) {

            const listOfSeatsIndex: number[] = [];
            const playingUsers = [];
            for await (const ele of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[ele]).length > NUMERICAL.ZERO) {
                    if (roundTableData.seats[ele].userStatus === PLAYER_STATE.PLAYING) {
                        listOfSeatsIndex.push(roundTableData.seats[ele].seatIndex)
                        playingUsers.push(roundTableData.seats[ele].userId)
                    }
                }
            }
            logger.info("----->> bootCollect :: playingUsers :: ", playingUsers);
            roundTableData.tableState = TABLE_STATE.COLLECTING_BOOT_VALUE;
            roundTableData.isCollectBootSend = true;
            await setRoundTableData(tableId, currentRound, roundTableData);

            const userIds: string[] = _.compact(playingUsers);
            logger.info("----->> bootCollect :: playing players userIds :: ", userIds);

            if (roundTableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {

                if (
                    roundTableData.maxPlayers !== NUMERICAL.TWO &&
                    roundTableData.totalPlayers !== NUMERICAL.SIX
                ) {

                    commonEventEmitter.emit(EVENTS.ARRANGE_SEATING, {
                        tableId: tableId,
                        data: {
                            playersCount: userIds.length
                        }
                    });
                    isSendArrangeSeats = true;
                }
            }

            for await (let userID of userIds) {

                const userInfo = await getUser(userID);
                const playerDetail = await getPlayerGamePlay(userID, tableId);

                userInfo.balance -= roundTableData.rummyType === RUMMY_TYPES.POINT_RUMMY ? userInfo.bootAmount * NUMERICAL.EIGHTEEN : userInfo.bootAmount;

                playerDetail.userStatus = PLAYER_STATE.PLAYING;
                playerDetail.playingStatus = PLAYER_STATE.COLLECT_BOOT_AMOUNT;

                const promise = await Promise.all([
                    setUser(userID, userInfo),
                    setPlayerGamePlay(userID, tableId, playerDetail)
                ]);

                if (!isSendArrangeSeats) {
                    const tableData = await getTableData(tableId);
                    const bootCollectData = {
                        balance: userInfo.balance,
                        listOfSeatsIndex: listOfSeatsIndex,
                        winPrice: tableData.winPrice
                    }

                    const formatedResponse = await formatBootCollectionInfo(bootCollectData);
                    logger.info("---> bootCollect :: formatBootCollectionInfo :: ", formatedResponse);

                    commonEventEmitter.emit(EVENTS.COLLECT_BOOT_VALUE_SOCKET_EVENT, {
                        socket: userInfo.socketId,
                        data: formatedResponse
                    });
                }
            }
            return {
                isSendArrangeSeats,
                isCountiusGame: !isSendArrangeSeats
            };
        } else {
            logger.info("------>> bootCollect :: wait popup :: ");
            roundTableData.tableState = TABLE_STATE.WAIT_FOR_PLAYER;

            await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData);

            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.TOST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE,
                }
            });
            return {
                isSendArrangeSeats,
                isCountiusGame
            };
        }
    } catch (error: any) {
        logger.error("----->> bootCollect :: ERROR :: ", error);
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- bootCollect :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            throw new Errors.CancelBattle(error);
        } else if (error && error.type === ERROR_TYPE.BOOT_COLLECTION_ERROR) {
            logger.error(
                `--- bootCollect :: ERROR_TYPE :: ${ERROR_TYPE.BOOT_COLLECTION_ERROR}::`,
                error,
                "tableId :: ",
                tableId
            );
            throw error;
        }
        else if (error instanceof Errors.createCardGameTableError) {
            logger.error(
                "--- bootCollect :: createCardGameTableError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            throw new Errors.createCardGameTableError(error);
        } else {
            throw error;
        }
    }
}

export = bootCollect;