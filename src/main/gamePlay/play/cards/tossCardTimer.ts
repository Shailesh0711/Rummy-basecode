import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, SHUFFLE_CARDS, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { bootAmountCollectQueueIf } from "../../../interfaces/schedulerIf";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getTableData } from "../../cache/Tables";
import shuffleCards from "./shuffleCards";
import { userSeatKeyIf, tosscardI } from "../../../interfaces/roundTableIf";
import commonEventEmitter from "../../../commonEventEmitter";
import formatTossCardInfo from "../../formatResponse/formatTossCardInfo";
import getPlayerIdForRoundTable from "../../utils/getPlayerIdForRoundTable";
import playerplayingStatusUpdate from "../../utils/playerplayingStatusUpdate";
import selectDealer from "../turn/selectDealer";
import { roundTableIf } from "../../../interfaces/roundTableIf"
import { playingTableIf } from "../../../interfaces/playingTableIf";
import Scheduler from "../../../scheduler";
import config from "../../../../connections/config";
import Errors from "../../../errors"
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import roundHistory from "../History/roundHistory";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getLock } from "../../../lock";

async function tossCard(
    tableId: string,
    roundTableData: roundTableIf,
    currentRound: number
): Promise<void> {
    logger.info("====================>> tossCard <<=======================")
    try {
        let cardArray = SHUFFLE_CARDS.DECK_ONE;
        cardArray = shuffleCards(cardArray);

        logger.info("----->> tossCard :: cardArray :: ", cardArray)

        function rendomCard(cards: string[]): number {
            const rt = Math.floor(Math.random() * cards.length);
            return rt
        }

        const tossCardPlayersDetails: Array<tosscardI> = [];

        for await (const seat of Object.keys(roundTableData.seats)) {

            const ele: userSeatKeyIf = roundTableData.seats[seat];

            const tossCardObj: tosscardI = {} as tosscardI;
            let tossCardInd = rendomCard(cardArray);

            if (Object.keys(ele).length > NUMERICAL.ZERO) {

                if (ele.userStatus == PLAYER_STATE.PLAYING) {

                    tossCardObj.userId = ele.userId as string;
                    tossCardObj.seatIndex = ele.seatIndex as number;
                    tossCardObj.username = ele.username as string;
                    tossCardObj.card = cardArray.splice(tossCardInd, NUMERICAL.ONE)[NUMERICAL.ZERO]
                    tossCardPlayersDetails.push(tossCardObj);

                }
            }
        }

        logger.info("----->> tossCardArr :: Before :: ", tossCardPlayersDetails);

        const cardValueArr = <number[]>[];
        const cardSuitArr = <string[]>[];
        let tossWinSuitCard: string = "";

        tossCardPlayersDetails.map((ele, ind) => {
            let cardArr: string[] = ele.card.split('_');
            cardSuitArr.push(cardArr[NUMERICAL.ZERO]);
            cardValueArr.push(Number(cardArr[NUMERICAL.ONE]));
        })

        let largevalue = Math.max(...cardValueArr);
        let largeValueIndex: number[] = []
        let count: number = NUMERICAL.ZERO

        cardValueArr.forEach((ele, index) => {
            if (ele === largevalue) {
                largeValueIndex.push(index)
                count += NUMERICAL.ONE
            }
        })

        logger.info("----->> tossCard :: tossCardPlayersDetails :: ", tossCardPlayersDetails)

        if (count === NUMERICAL.TWO) {
            const largeSameCardSuit: string[] = largeValueIndex.map((ele) => {
                return cardSuitArr[ele]
            })

            let inde: number = largeSameCardSuit.findIndex((ele) => ele == "S");
            tossWinSuitCard = largeSameCardSuit[inde];

            if (inde == -NUMERICAL.ONE) {
                let inde: number = largeSameCardSuit.findIndex((ele: any) => ele == "C");
                tossWinSuitCard = largeSameCardSuit[inde];

                if (inde == -NUMERICAL.ONE) {
                    let inde: number = largeSameCardSuit.findIndex((ele: any) => ele == "D");
                    tossWinSuitCard = largeSameCardSuit[inde];

                    if (inde == -NUMERICAL.ONE) {
                        let inde: number = largeSameCardSuit.findIndex((ele: any) => ele == "H");
                        tossWinSuitCard = largeSameCardSuit[inde];
                    }
                }
            }
        }

        let tossWinercard: string;

        if (tossWinSuitCard) {
            tossWinercard = `${tossWinSuitCard}_${largevalue}_0_1`
        } else {
            const val = cardValueArr.findIndex((ele: any) => ele == largevalue)
            const suit = cardSuitArr[val]
            tossWinercard = `${suit}_${largevalue}_0_1`;
        }

        logger.info("----->> tossCard :: tossWinercard :: ", tossWinercard);

        const tossWinnerPlayer: tosscardI = tossCardPlayersDetails.find((ele) => ele.card === tossWinercard) as tosscardI;

        logger.info("----->> tossCard :: tossWinnerPlayer :: ", tossWinnerPlayer);

        const eventData = {
            tableId,
            tossWinnerPlayer: tossWinnerPlayer,
            tossDetail: tossCardPlayersDetails
        }

        let lock = await getLock().acquire([`locks:${tossWinnerPlayer.userId}`], 2000);
        try {
            const [formatedTossCardData, tossWinnerPlayerGamePlayInfo, userIds] = await Promise.all([
                await formatTossCardInfo(eventData),
                await getPlayerGamePlay(tossWinnerPlayer.userId, tableId),
                await getPlayerIdForRoundTable(tableId, currentRound),
            ])

            logger.info("----->> tossCard :: userIds :: ", userIds);

            if (tossWinnerPlayerGamePlayInfo === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.TOSS_CARD_TIMER_ERROR,
                    message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }

            const dealerPlayerId = await selectDealer(tossWinnerPlayer.userId, tableId, currentRound);
            logger.info("----->> tossCard :: dealerPlayerId :: ", dealerPlayerId);

            const roundTableDataInfo = await getRoundTableData(tableId, currentRound);
            logger.info("----->> tossCard :: roundTableDataInfo :: ", roundTableDataInfo);

            if (roundTableDataInfo === null) {
                const errorObj: throwErrorIF = {
                    type: ERROR_TYPE.TOSS_CARD_TIMER_ERROR,
                    message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                    isCommonToastPopup: true,
                };
                throw errorObj;
            }

            roundTableDataInfo.firstTurn = true;
            roundTableDataInfo.currentTurn = tossWinnerPlayer.userId;
            roundTableDataInfo.tossWinnerPlayer = tossWinnerPlayer.userId;
            roundTableDataInfo.dealerPlayer = dealerPlayerId;
            roundTableDataInfo.tableState = TABLE_STATE.TOSS_CARDS;
            tossWinnerPlayerGamePlayInfo.isFirstTurn = true;

            const promise = await Promise.all([
                await setPlayerGamePlay(tossWinnerPlayer.userId, tableId, tossWinnerPlayerGamePlayInfo),
                await setRoundTableData(tableId, currentRound, roundTableDataInfo),
                await playerplayingStatusUpdate(tableId, userIds, PLAYER_STATE.TOSS_CARD),
                await roundHistory(roundTableDataInfo, currentRound, { tossWinnerPlayer, tossDetail: tossCardPlayersDetails })
            ])

            for await (const seat of Object.keys(roundTableDataInfo.seats)) {
                if (Object.keys(roundTableDataInfo.seats[seat]).length > NUMERICAL.ZERO) {
                    if (
                        roundTableDataInfo.seats[seat].userStatus !== PLAYER_STATE.WATCHING &&
                        roundTableDataInfo.seats[seat].userStatus !== PLAYER_STATE.LOST &&
                        roundTableDataInfo.seats[seat].userStatus !== PLAYER_STATE.LEFT
                    ) {

                        const playerData = await getPlayerGamePlay(roundTableDataInfo.seats[seat].userId, tableId);
                        logger.info("----->> tossCard :: playerData :: ", playerData);
                        commonEventEmitter.emit(EVENTS.TOSS_CARD_SOCKET_EVENT, {
                            socket: playerData.socketId,
                            data: formatedTossCardData
                        });
                    }
                }
            }

        } catch (error) {
            logger.error(`----tossCard :: TOSS WINNER :: LOCK :: ERROR :: `, error);
        } finally {
            if (lock) {
                await getLock().release(lock);
            }
        }

    } catch (error: any) {
        console.log("---- tossCard :: ERROR ::", error)
        logger.error("---- tossCard :: ERROR ::", error)
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error)
        } else if (error && error.type === ERROR_TYPE.TOSS_CARD_TIMER_ERROR) {
            throw error
        } else {
            throw error
        }
    }
}


async function tossCardTimer(
    data: bootAmountCollectQueueIf
): Promise<void> {
    const { TOSS_CARD_TIMER } = config()
    const { tableId, currentRound } = data
    logger.info("================>> tossCardTimer <<=====================")
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.TOSS_CARD_TIMER_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("----->> tossCardTimer :: roundTableData :: ", roundTableData);

        await tossCard(tableId, roundTableData, currentRound);

        await Scheduler.addJob.TossCardTimer({
            timer: TOSS_CARD_TIMER * NUMERICAL.THOUSAND,
            tableId,
            currentRound
        });
    } catch (error: any) {
        logger.error("tossCardTimer :: ERROR :: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- tossCardTimer :: CancelBattle :: ERROR ::",
                error,
                "tableId :: ",
                tableId
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
        } else if (error && error.type === ERROR_TYPE.TOSS_CARD_TIMER_ERROR) {
            logger.error(
                `--- tossCardTimer :: ERROR_TYPE :: ${ERROR_TYPE.TOSS_CARD_TIMER_ERROR}::`,
                error,
                "tableId :: ",
                tableId
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
                "--- tossCardTimer :: commonError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: MESSAGES.ERROR.TOSS_CARDS_ERROR_MESSAGES,
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
    }
}

export = tossCardTimer;