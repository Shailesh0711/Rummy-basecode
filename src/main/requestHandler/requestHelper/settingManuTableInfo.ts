import { EVENTS, GRPC_ERROR_REASONS, MESSAGES, NUMERICAL, RUMMY_TYPES } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getTableData } from "../../gamePlay/cache/Tables";
import formatSettingMenuTableInfo from "../../gamePlay/formatResponse/formatSettingMenuTableInfo";
import { settingManuTableInfoHandlerReqIF } from "../../interfaces/requestIf";
import { requestValidator } from "../../validator";
import Errors from "../../errors"
import { getUser } from "../../gamePlay/cache/User";
import { gameSettinghelp } from "../../clientsideapi";


async function settingManuTableInfoHandler(
    { data }: settingManuTableInfoHandlerReqIF,
    socket: any,
    ack?: Function
) {
    try {
        data = await requestValidator.settingManuTableInfoValidator(data);

        const tableData = await getTableData(data.tableId);
        const userData = await getUser(data.userId)
        logger.info(`----->> settingManuTableInfoHandler :: tableData :: `, tableData);
        logger.info(`----->> settingManuTableInfoHandler :: userData :: `, userData);

        const help = await gameSettinghelp(tableData.gameId, userData.authToken, socket.id, data.userId);

        const gameModeType = tableData.rummyType === RUMMY_TYPES.POINT_RUMMY ?
            "Point Rummy" : tableData.rummyType === RUMMY_TYPES.POOL_RUMMY ?
                `${tableData.gamePoolType} Pool Rummy` : tableData.rummyType === RUMMY_TYPES.DEALS_RUMMY ?
                    `${tableData.dealType} Deal Rummy` : "Rummy"

        const formatRes = await formatSettingMenuTableInfo(
            tableData._id,
            gameModeType,
            `realMoney`,
            NUMERICAL.TWO,
            MESSAGES.MESSAGE.PRINTED_JOKER,
            NUMERICAL.TEN,
            {
                FRIST_DROP: `First ${tableData.firstDrop} Points`,
                MIDDLE_DROP: `Middle ${tableData.middleDrop} Points`,
                // LAST_DROP: `Full Count ${tableData.lastDrop} Points`
                LAST_DROP: ""
            }
        );

        commonEventEmitter.emit(EVENTS.SETTING_MENU_GAME_TABLE_INFO, {
            socket: socket,
            data: formatRes
        });

    } catch (error: any) {
        logger.info(`settingManuTableInfoHandler :: ERROR :: `, error);
        let nonProdMsg = ``
        if (error instanceof Errors.InvalidInput) {
            nonProdMsg = "Invalid Input";
            logger.error(
                "--- settingManuTableInfoHandler :: InvalidInput :: ERROR ::",
                error,
                `tableId :: ${data.tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
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
                "--- settingManuTableInfoHandler :: CancelBattle :: ERROR ::",
                error,
                `tableId :: ${data.tableId}`
            );
            nonProdMsg = "CancelBattle";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                tableId: data.tableId,
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
        } else if (error instanceof Errors.UnknownError) {
            nonProdMsg = 'GRPC_FAILED';
            logger.error(
                "--- settingManuTableInfoHandler :: UnknownError :: ERROR ::",
                error,
                `tableId :: ${data.tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
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
                "--- settingManuTableInfoHandler :: commonError :: ERROR ::",
                error,
                `tableId :: ${data.tableId}`
            );
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: GRPC_ERROR_REASONS.LAST_DEAL_ERROR,
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

export = settingManuTableInfoHandler;