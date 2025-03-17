import { ERROR_TYPE, EVENTS, EVENT_EMITTER, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, PLAYER_STATE, REDIS, RUMMY_TYPES } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { UserInfoIf, playerInfoIf } from "../../../interfaces/scoreBoardIf";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import { removeRejoinTableHistory } from "../../cache/TableHistory";
import { getTableData, setTableData } from "../../cache/Tables";
import { formatGameTableInfo } from "../../formatResponse";
import formatLeaveTableInfo from "../../formatResponse/formatLeaveTableInfo";
import getPlayerIdForRoundTable from "../../utils/getPlayerIdForRoundTable";
import { roundHistory } from "../History";
import selectDealer from "../turn/selectDealer";
import filterPlayerForNextRound from "./helper/filterPlayerForNextRound";
import filterRoundTableForNextRound from "./helper/filterRoundTableForNextRound";
import startRound from "./startRound";
import Errors from "../../../errors";
import { throwErrorIF } from "../../../interfaces/throwError";
import winner from "../winner";
import nextRoundUserIds from "./helper/nextRoundUserIds";
import nextRoundPlayersInfo from "./helper/nextRoundPlayersInfo";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { setScoketData } from "./helper/setSocketData";
import Scheduler from "../../../scheduler";
import { newGameStart } from "../newGameStart";
import { removeTurnHistoy } from "../../cache/TurnHistory";
import { removeRoundTableHistory } from "../../cache/RoundHistory";
import { removeScoreBoardHistory } from "../../cache/ScoreBoardHistory";
import { getUser, setUser } from "../../cache/User";
import cancelAllTimers from "../winner/helper/cancelTimers";
import { formateScoreIf } from "../../../interfaces/clientApiIf";
import { markCompletedGameStatus } from "../../../clientsideapi/markCompletedGameStatus";
import { formatMultiPlayerScore } from "../../utils/formatMultiPlayerScore";
import { multiPlayerWinnScore } from "../../../clientsideapi";
import { decrCounterLobbyWise, getOnliPlayerCountLobbyWise, removeOnliPlayerCountLobbyWise } from "../../cache/onlinePlayer";
import { pointRummyScoreBoadPlayerInfo } from "../scoreBoard/helper/pointRummyScoreBoadPlayerInfo";
import { getLock } from "../../../lock";
import { pointRummyNextRound } from "./rummyNextRound/pointRummyNextRound";
import { poolRummyNextRound } from "./rummyNextRound/poolRummyNextRound";
import { dealRummyNextRound } from "./rummyNextRound/dealRummyNextRound";

async function nextRoundStart(
    tableId: string,
    currentRound: number
): Promise<void> {
    logger.info("==============================>> nextRoundStart <<==============================")
    try {
        logger.info("-------->> nextRoundStart :: currentRound :: ", currentRound);

        const tableData = await getTableData(tableId);
        if (tableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.NEXT_ROUND_CHANGE_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info("------->> nextRoundStart :: tableData :: ", tableData);

        switch (tableData.rummyType) {

            case RUMMY_TYPES.POINT_RUMMY:
                await pointRummyNextRound(tableData, currentRound)
                break;

            case RUMMY_TYPES.POOL_RUMMY:
                await poolRummyNextRound(tableData, currentRound)
                break;

            case RUMMY_TYPES.DEALS_RUMMY:
                await dealRummyNextRound(tableData, currentRound)
                break;

            default:
                logger.info("<<====== Default :: nextRoundStart :: Call ========>>");
                break;
        }

    } catch (error: any) {
        logger.error("---nextRoundStart :: ERROR: " + error);
        console.log("---nextRoundStart :: ERROR: ", error);
        let nonProdMsg = '';
        if (error instanceof Errors.InvalidInput) {
            logger.error(
                "--- nextRoundStart :: InvalidInput :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            nonProdMsg = "Invalid Input";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: MESSAGES.GRPC_ERRORS.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT]
                }
            })
        } else if (error instanceof Errors.CancelBattle) {
            logger.error(
                "--- nextRoundStart :: CancelBattle :: ERROR ::",
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
            });
        } else if (error && error.type === ERROR_TYPE.NEXT_ROUND_CHANGE_ERROR) {
            logger.error(
                `--- nextRoundStart :: ERROR_TYPE :: ${ERROR_TYPE.NEXT_ROUND_CHANGE_ERROR}::`,
                error,
                "tableId :: ",
                tableId
            );
            nonProdMsg = "Database Error";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: tableId,
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
        } else if (error instanceof Errors.UnknownError) {
            nonProdMsg = 'GRPC_FAILED';
            logger.error(
                "--- nextRoundStart :: UnknownError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
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
                "--- nextRoundStart :: commonError :: ERROR ::",
                error,
                "tableId :: ",
                tableId
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.NEXT_ROUND_ERROR,
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

export = nextRoundStart;