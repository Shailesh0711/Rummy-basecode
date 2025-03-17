import axios from "axios";
import CommonEventEmitter from "../commonEventEmitter";
import Errors from "../errors";
import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
import config from "../../connections/config";
import logger from "../../logger";

async function checkUserBlockStatus(tablePlayerIds: string[], token: string, socketId: string, tableId : string): Promise<any> {
    
    const { CHECK_USER_BLOCK_STATUS, APP_KEY, APP_DATA } = config();
    logger.debug(tableId, "checkUserBlockStatus :: ", tablePlayerIds, token);
    try {
        const url = CHECK_USER_BLOCK_STATUS;
        logger.debug(tableId, "checkUserBlockStatus :: url :", url);

        const responce = await axios.post(url, { tablePlayerIds }, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key':APP_KEY, 'x-mgpapp-data':APP_DATA } })
        logger.info(tableId, "checkUserBlockStatus : responce :: ", responce.data);

        const checkUserBlockStatusData = responce.data.data
        logger.info(tableId, "resData : checkUserBlockStatus :: ", checkUserBlockStatusData);

        if (!responce || !responce.data.success || !checkUserBlockStatusData) {
            throw new Errors.InvalidInput('Unable to fetch checkUserBlockStatus data');
        }
        if (responce.data.message === MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE) {
            logger.info(tableId, `Server under the maintenance.`)
            throw new Errors.UnknownError('Unable to fetch checkUserBlockStatus data');
        }
        return checkUserBlockStatusData.isUserBlock;

    } catch (error : any) {
        logger.error(tableId, 'CATCH_ERROR : checkUserBlockStatus :>> ', error, "-", tablePlayerIds, token);
        logger.error(tableId, "error.response.data ", error.response.data);

        if (error instanceof Errors.UnknownError) {
            let nonProdMsg = "Server under the maintenance!";
            CommonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: socketId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        }
        else if (error.response && error.response.data && !error.response.data.success) {
            let nonProdMsg = "Fetch data failed!";
            CommonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: socketId,
                data: {
                    isPopup: true,
                    popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                    title: nonProdMsg,
                    message: error.response.data.message ? error.response.data.message : MESSAGES.ERROR.COMMON_ERROR,
                    buttonCounts: NUMERICAL.ONE,
                    button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                    button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                    button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
            });
        }
        else{
            let nonProdMsg = "Fetch data failed!";
            CommonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                socket: socketId,
                data: {
                  isPopup: true,
                  popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                  title: nonProdMsg,
                  message: MESSAGES.ERROR.COMMON_ERROR,
                  buttonCounts: NUMERICAL.ONE,
                  button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                  button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                  button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                },
              });
        }
        return true;
    }


}

const exportedObj = {
    checkUserBlockStatus,
};

export = exportedObj;