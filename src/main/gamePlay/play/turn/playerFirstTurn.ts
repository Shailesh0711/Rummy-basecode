import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { distributeCardsQueueIf } from "../../../interfaces/schedulerIf";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getTableData } from "../../cache/Tables";
import getPlayerIdForRoundTable = require("../../utils/getPlayerIdForRoundTable");
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import commonEventEmitter = require("../../../commonEventEmitter");
import Errors = require("../../../errors")
import { throwErrorIF } from "../../../interfaces/throwError";
import { startTurn } from "./helper";
import { setRejoinTableHistory } from "../../cache/TableHistory";

async function playerFirstTurn(
    data: distributeCardsQueueIf
): Promise<void> {
    logger.info("====================>> playerFirstTurn <<=====================")
    const { tableId, currentRound } = data;
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info(`----------->> playerFirstTurn :: roundTableData ::`, roundTableData);
        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.PLAYER_FIRST_TURN_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }

        const tableData = await getTableData(tableId);
        logger.info(`----------->> playerFirstTurn :: tableData ::`, tableData);

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                if (roundTableData.seats[seat].userStatus === PLAYER_STATE.PLAYING) {

                    await setRejoinTableHistory(
                        roundTableData.seats[seat].userId,
                        tableData.gameId,
                        tableData.lobbyId,
                        {
                            userId: roundTableData.seats[seat].userId,
                            tableId,
                            lobbyId: tableData.lobbyId,
                            isEndGame: false,
                        },
                    )
                }
            }
        }

        logger.info("----->>  playerFirstTurn :: tableData current Round :: ", currentRound)

        if (roundTableData.firstTurn && roundTableData.tableState === TABLE_STATE.PROVIDED_CARDS) {

            logger.info("==========>> playerFirstTurn :: 1 <<=============")
            roundTableData.tableState = TABLE_STATE.TURN_STARTED
            const userIds = await getPlayerIdForRoundTable(tableId, currentRound);
            logger.info("---> playerFirstTurn :: userIds :: ", userIds)

            await setRoundTableData(tableId, currentRound, roundTableData);

            if (currentRound > NUMERICAL.ONE) {
                const oldRoundTableData = await getRoundTableData(tableId, currentRound - NUMERICAL.ONE);
                logger.info("---> playerFirstTurn :: oldRoundTableData :: ", oldRoundTableData);

                if (oldRoundTableData.rejoinGamePlayersName.length > NUMERICAL.ZERO) {
                    const nameJoin = oldRoundTableData.rejoinGamePlayersName.join(', ')

                    commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                        tableId,
                        data: {
                            isPopup: true,
                            popupType: MESSAGES.ALERT_MESSAGE.TYPE.WAIT_MIDDLE_TOAST_POPUP,
                            title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                            message: `The ${nameJoin} has rejoined the game with ₹${tableData.bootAmount} and the new winning amount is ₹${tableData.winPrice}`,
                        }
                    });
                }
            }

            await startTurn(tableId, userIds, currentRound);
        }
        else {
            logger.warn("----->> playerFirstTurn :: Turn is not started Or not Provid Cards");
        }
    } catch (error: any) {
        logger.error("---playerFirstTurn :: ERROR ::", error);
        console.log("---playerFirstTurn :: ERROR ::", error)
        let nonProdMsg = '';
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- playerFirstTurn :: CancelBattle :: ERROR ::",
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
        } else if (error && error.type === ERROR_TYPE.PLAYER_FIRST_TURN_ERROR) {
            logger.error(
                `--- playerFirstTurn :: ERROR_TYPE :: ${ERROR_TYPE.PLAYER_FIRST_TURN_ERROR}::`,
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
                `--- playerFirstTurn :: commonError :: `,
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.PLAYER_FIRST_TURN_ON_ERROR,
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



export = playerFirstTurn;