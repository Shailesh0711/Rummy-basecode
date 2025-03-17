import { getUser, setUser } from "../../cache/User";
import Errors from "../../../errors"
import { getTableData, setTableData } from "../../cache/Tables";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, TABLE_STATE } from "../../../../constants";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import commonEventEmitter from "../../../commonEventEmitter";
import { formatBootCollectionInfo } from "../../formatResponse";
import { throwErrorIF } from "../../../interfaces/throwError";
import logger from "../../../../logger";
import { leaveRoundTable } from "../../play/leaveTable/leaveRoundTable";
import { userIf } from "../../../interfaces/userSignUpIf";
import { getUserOwnProfile } from "../../../clientsideapi/getUserOwnProfile";
import { multiPlayerDeductEntryFeeResponse } from "../../../interfaces/clientApiIf";
import { multiPlayerDeductEntryFee } from "../../../clientsideapi/multiPlayerDeductEntryFee";
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

        const tableData = await getTableData(tableId);
        logger.info("----->> bootCollect :: tableData :: ", tableData);
        if (tableData.minPlayerForPlay <= roundTableData.totalPlayers) {

            let listOfSeatsIndex: number[] = [];
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
            await setRoundTableData(tableId, currentRound, roundTableData);

            const userIds: string[] = _.compact(playingUsers);
            logger.info("----->> bootCollect :: playing players userIds :: ", userIds);

            const apiData = {
                tableId,
                tournamentId: tableData.lobbyId,
                userIds: userIds
            }

            const userProfile = await getUser(userIds[NUMERICAL.ZERO]) as userIf;
            const multiPlayerDeductEntryFeeData: multiPlayerDeductEntryFeeResponse = await multiPlayerDeductEntryFee(apiData, userProfile.authToken, userProfile.socketId);
            logger.info("bootCollect ::  multiPlayerDeductEntryFeeData :: >> ", multiPlayerDeductEntryFeeData);

            const { isMinPlayerEntryFeeDeducted, deductedUserIds, notDeductedUserIds } = multiPlayerDeductEntryFeeData;

            logger.info(" bootCollect :: isMinPlayerEntryFeeDeducted :: >> ", isMinPlayerEntryFeeDeducted);
            logger.info(" bootCollect :: deductedUserIds :: >> ", deductedUserIds);
            logger.info(" bootCollect ::  notDeductedUserIds :: >> ", notDeductedUserIds);
            logger.info(" bootCollect ::  roundTableData.noOfPlayer :: >> ", roundTableData.totalPlayers);

            listOfSeatsIndex = [];
            for await (let userID of deductedUserIds) {
                for await (const seat of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                        if (userID === roundTableData.seats[seat].userId) {
                            listOfSeatsIndex.push(roundTableData.seats[seat].seatIndex)
                        }
                    }
                }
            }
            logger.info("----->> bootCollect :: listOfSeatsIndex :: 1 ::", listOfSeatsIndex);

            if (isMinPlayerEntryFeeDeducted) {
                logger.info("----->> bootCollect :: roundTableData.maxPlayers :: ", roundTableData.maxPlayers);
                logger.info("----->> bootCollect :: deductedUserIds.length :: ", deductedUserIds.length);

                isCountiusGame = true;
                if (roundTableData.rummyType !== RUMMY_TYPES.POINT_RUMMY) {
                    if (roundTableData.maxPlayers !== NUMERICAL.TWO && deductedUserIds.length !== NUMERICAL.SIX) {
                        if (
                            (roundTableData.maxPlayers === NUMERICAL.FOUR && deductedUserIds.length !== NUMERICAL.FOUR) ||
                            roundTableData.maxPlayers === NUMERICAL.SIX
                        ) {
                            commonEventEmitter.emit(EVENTS.ARRANGE_SEATING, {
                                tableId: tableId,
                                data: {
                                    playersCount: listOfSeatsIndex.length
                                }
                            });
                            isSendArrangeSeats = true;
                            isCountiusGame = false;
                        }
                    }
                }

                for await (let userID of deductedUserIds) {
                    logger.info("----->> bootCollect :: deductedUserIds :: userID :: ", userID);

                    const userInfo = await getUser(userID);

                    // update balance from client cliend api
                    const userOwnProfile = await getUserOwnProfile(userInfo.authToken, userInfo.socketId, userInfo.userId);
                    const updatedBalance: number = userOwnProfile.bonus + userOwnProfile.winCash + userOwnProfile.cash;
                    const playerDetail = await getPlayerGamePlay(userID, tableId);

                    userInfo.balance = updatedBalance;
                    playerDetail.userStatus = PLAYER_STATE.PLAYING;
                    playerDetail.playingStatus = PLAYER_STATE.COLLECT_BOOT_AMOUNT;

                    roundTableData.totalDealPlayer = deductedUserIds.length
                    roundTableData.splitPlayers = deductedUserIds.length;
                    roundTableData.isCollectBootSend = true;

                    tableData.winPrice = (tableData.bootAmount * deductedUserIds.length) * (1 - (tableData.rake / 100))
                    tableData.winPrice = Number(tableData.winPrice.toFixed(2));

                    const promise = await Promise.all([
                        setUser(userID, userInfo),
                        setPlayerGamePlay(userID, tableId, playerDetail),
                        setTableData(tableData),
                        setRoundTableData(tableId, currentRound, roundTableData)
                    ]);
                    if (!isSendArrangeSeats) {
                        const bootCollectData = {
                            balance: userInfo.balance,
                            listOfSeatsIndex: listOfSeatsIndex,
                            winPrice: tableData.winPrice
                        }

                        const formatedResponse = await formatBootCollectionInfo(bootCollectData);
                        logger.info("---> bootCollect :: formatBootCollectionInfo :: ", formatBootCollectionInfo);

                        commonEventEmitter.emit(EVENTS.COLLECT_BOOT_VALUE_SOCKET_EVENT, {
                            socket: playerDetail.socketId,
                            data: formatedResponse
                        });
                    }
                }
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

                isCountiusGame = false;
            }

            if (notDeductedUserIds.length > NUMERICAL.ZERO) {
                //popup send and leave table 
                // for (let i = 0; i < notDeductedUserIds.length; i++) {
                for await (const userID of notDeductedUserIds) {
                    const userProfile = await await getUser(userID) as userIf;
                    if (!userProfile) throw Error('Unable to get user data');
                    const playerData = await getPlayerGamePlay(userProfile.userId, tableId);
                    logger.info("------>> bootCollect :: playerData :: ", playerData);

                    logger.info("Starting notDeductedUserIds  :: leaveTable  :: " + userID);

                    let msg = MESSAGES.ERROR.ENTRY_FEE_DEDUCTED_MSG;
                    let nonProdMsg = "FAILED!";

                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        socket: playerData.socketId,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                            title: nonProdMsg,
                            message: msg,
                            tableId,
                            buttonCounts: NUMERICAL.ONE,
                            button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                            button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                            button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                        },
                    });

                    for await (const key of Object.keys(roundTableData.seats)) {
                        if (roundTableData.seats[key].length != 0) {
                            if (roundTableData.seats[key].userId === userProfile.userId)
                                roundTableData.seats[key] = {};
                        }
                    }
                    roundTableData.totalPlayers -= NUMERICAL.ONE;
                    roundTableData.currentPlayer -= NUMERICAL.ONE;
                    await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData)

                    playerData.userStatus = PLAYER_STATE.LEFT;
                    playerData.playingStatus = PLAYER_STATE.LEFT;
                    playerData.isLeft = true;

                    await setPlayerGamePlay(userProfile.userId, tableId, playerData)

                    await leaveRoundTable(false, true, playerData.userId, tableId, currentRound)

                }
            }

            return {
                isCountiusGame,
                isSendArrangeSeats
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
                isCountiusGame,
                isSendArrangeSeats
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