import axios from "axios";
import Errors from "../errors";
import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
import logger from "../../logger";
import config from "../../connections/config";
import commonEventEmitter from "../commonEventEmitter";

async function checkMaintanence(token: string, socketId: string, userId : string) {
    logger.debug("checkMaintanence ::=>> ",token);
    const { CHECK_MAINTANENCE, APP_KEY, APP_DATA } = config();
    try {

        const url = CHECK_MAINTANENCE;
        logger.debug(userId, "checkMaintanence url :: ", url);
        logger.debug(userId, "APP_KEY : ", APP_KEY, "APP_DATA : ", APP_DATA);
        let responce = await axios.post(url, {}, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key': APP_KEY, 'x-mgpapp-data': APP_DATA } })
        logger.info(userId, "resData : checkBalance responce :: ", responce.data);

        let checkMaintanenceDetail = responce.data.data;
        logger.info(userId, "resData : checkMaintanenceDetail :: ", checkMaintanenceDetail);

        if (!responce || !responce.data.success || !checkMaintanenceDetail) {
            throw new Errors.InvalidInput('Unable to fetch checkMaintanence data');
        }
        return checkMaintanenceDetail;

    } catch (error: any) {
        logger.error(userId, 'CATCH_ERROR :  checkMaintanence :>> ', token, "-", error);
        logger.error(userId, "error.response.data ", error.response.data);

        if (error.response && error.response.data && !error.response.data.success) {
            let nonProdMsg = "Fetch data failed!";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
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
        else {
            let nonProdMsg = "Fetch data failed!";
            commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
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
        throw error;
    }
}

const exportedObj = {
    checkMaintanence,
};

export = exportedObj;