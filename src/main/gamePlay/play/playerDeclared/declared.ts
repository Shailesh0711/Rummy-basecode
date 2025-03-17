import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import commonEventEmitter from "../../../commonEventEmitter";
import { StartFinishTimerCancel } from "../../../scheduler/cancelJob";
import { id } from "../../../validator/schemas/requestSchemas/cardsSortSchema";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../cache/Players";
import { getRoundTableData, setRoundTableData } from "../../cache/Rounds";
import countTotalPoints from "../../utils/countTotalPoint";
import playerplayingStatusUpdate from "../../utils/playerplayingStatusUpdate";
import checkCardSequence from "../cards/checkCardSequence";
import getPlayerIdForRoundTable from "../../utils/getPlayerIdForRoundTable";
import Scheduler from "../../../scheduler"
import { otherPlayersIf } from "../../../interfaces/schedulerIf";
import ScoreBoard from "../scoreBoard/scoreBoad";
import autoDeclareFinishDeckUser from "./autoDeclareFinishDeckUser";
import autoDeclareRemainPlayers from "./autoDeclareRemainPlayers";
import { throwErrorIF } from "../../../interfaces/throwError";
import Errors from "../../../errors"

async function declared(
    userId: string,
    tableId: string,
    currentRound: number,
): Promise<void> {
    logger.info("-------------------->> declare <<---------------------")
    try {
        logger.info(
            "------>> declared :: data :: ",
            `userId :: ${userId}`,
            `tableId :: ${tableId}`,
            `currentRound :: ${currentRound}`
        )
        const playerData = await getPlayerGamePlay(userId, tableId);
        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DECLARE_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`------>> declared :: roundTableData ::`, roundTableData)

        if (playerData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DECLARE_ERROR,
                message: MESSAGES.ERROR.PLAYING_PLAYER_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`------>> declared :: playerData ::`, playerData);

        if (
            playerData.playingStatus === PLAYER_STATE.DECLARED &&
            roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START
        ) {
            logger.info(`------>> declared :: player status -- ${playerData.playingStatus} :: table state -- ${roundTableData.tableState}`);

            await Scheduler.cancelJob.StartFinishTimerCancel(tableId);
            await autoDeclareFinishDeckUser(userId, tableId, currentRound);
        }
        else if (
            playerData.playingStatus === PLAYER_STATE.DECLARED &&
            roundTableData.tableState === TABLE_STATE.ROUND_OVER &&
            roundTableData.isValidDeclared
        ) {
            logger.info(`------>> declared :: player status -- ${playerData.playingStatus} :: table state -- ${roundTableData.tableState}`);

            await autoDeclareRemainPlayers(userId, tableId, currentRound);
        } else {
            logger.warn(`------>> declared :: player status -- ${playerData.playingStatus}`);
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: playerData.socketId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.MIDDLE_TOAST_POPUP,
                    title: MESSAGES.ALERT_MESSAGE.POPUP_TYPE,
                    message: MESSAGES.POPUP.MIDDLE_TOAST_POP.DECLARE_EVENT_MESSAGE,
                }
            });
        }
    } catch (error: any) {
        logger.error("---declared :: ERROR ---", error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        } else if (error && error.type === ERROR_TYPE.DECLARE_ERROR) {
            throw error
        } else {
            throw error
        }
    }
}

export = declared;