import config from "../../../../connections/config";
import { ERROR_TYPE, EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { waitingForPlayerIf } from "../../../interfaces/schedulerIf";
import Scheduler from "../../../scheduler"
import { getRoundTableData, removeRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { getTableData, popTableFromQueue, removeTableData } from "../../cache/Tables";
import Errors from "../../../errors"
import { formatRoundstartInfo } from "../../formatResponse";
import { throwErrorIF } from "../../../interfaces/throwError";
import { removeQueue } from "../../utils/manageQueue";
import { getUser, setUser } from "../../cache/User";
import { addGameRunningStatus } from "../../../clientsideapi/addGameRunningStatus";

async function waitForPlayers(
    info: waitingForPlayerIf
): Promise<void> {

    logger.info("==============>> waitForPlayers <<===============");
    const { TOTAL_GAME_START_TIMER, GAME_START_TIMER } = config()
    const { tableId, queueKey, currentRound, lobbyId } = info;
    try {
        
        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.WAITING_FOR_PLAYERS_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("------>> waitForPlayers :: roundTableData :: ", roundTableData);

        const tableData = await getTableData(tableId);
        logger.info("------>> waitForPlayers :: tableData :: ", roundTableData);

        if (tableData.minPlayerForPlay <= roundTableData.totalPlayers) {

            if (roundTableData.maxPlayers === roundTableData.totalPlayers) {
                await removeQueue(queueKey, tableId);
            }

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    const userData = await getUser(roundTableData.seats[seat].userId);
                    userData.OldLobbyId = lobbyId;
                    await setUser(roundTableData.seats[seat].userId, userData);
                    logger.info("------>> waitForPlayers :: userData :: ", userData);
                    await addGameRunningStatus(
                        {
                            tableId,
                            tournamentId: lobbyId,
                            gameId: tableData.gameId,
                        },
                        userData.authToken,
                        userData.socketId,
                        userData.userId
                    )
                }
            }

            roundTableData.tableState = TABLE_STATE.ROUND_TIMER_STARTED;
            roundTableData.updatedAt = new Date();
            await setRoundTableData(tableId, NUMERICAL.ONE, roundTableData);

            const formatedRoundStartRes = await formatRoundstartInfo(tableId, TOTAL_GAME_START_TIMER)
            logger.info("------>> waitForPlayers :: formatRoundstartInfo :: ", formatedRoundStartRes);

            commonEventEmitter.emit(EVENTS.ROUND_TIMER_STARTED_SOCKET_EVENT, {
                tableId,
                data: formatedRoundStartRes
            })

            await Scheduler.addJob.InitializeGameplay({
                timer: NUMERICAL.THOUSAND * GAME_START_TIMER,
                tableId,
                queueKey,
                currentRound: currentRound
            })
        } else {
            logger.info("------>> waitForPlayers :: wait popup :: ");
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
        }
    } catch (error: any) {

        await removeTableData(tableId)
        await removeRoundTableData(tableId, NUMERICAL.ZERO);

        let nonProdMsg = '';
        logger.error("---waitForPlayers :: ERROR: ", error);
        if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- waitForPlayers :: CancelBattle :: ERROR ::",
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

        } else if (error && error.type === ERROR_TYPE.WAITING_FOR_PLAYERS_ERROR) {
            logger.error(
                `--- waitForPlayers :: ERROR_TYPE :: ${ERROR_TYPE.WAITING_FOR_PLAYERS_ERROR}::`,
                error,
                "tableId :: ",
                tableId
            );
            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
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
            })
        } else {
            logger.error(
                "--- waitForPlayers :: commonError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: MESSAGES.ERROR.WAITING_FOR_PLAYER_ERROR_MESSAGES,
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

export = waitForPlayers