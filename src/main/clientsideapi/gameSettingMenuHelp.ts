import axios from 'axios';
import CommonEventEmitter from "../commonEventEmitter";
import Errors from "../errors";
import { EVENTS, MESSAGES, NUMERICAL } from '../../constants';
import config from '../../connections/config';
import logger from '../../logger';

async function gameSettinghelp(gameId: any, token: string, socketId: string, userId : string) {
    const { GAME_SETTING_MENU_HELP, APP_KEY, APP_DATA } = config();
    logger.debug("gmaneSettinghelp : :  ", gameId, token)
    try {
        const url = GAME_SETTING_MENU_HELP

        const responce = await axios.post(url, { gameId }, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key':APP_KEY, 'x-mgpapp-data':APP_DATA } });
        if (responce){
            logger.info(userId, "resData gmaneSettinghelp : : >> ", responce.data);
        }
        // logger.info(userId, "resData gmaneSettinghelp : : >> ", responce.data);

        const rules = responce.data.data;
        // logger.info(userId, "resData : gameSettinghelp rules :: ", rules);

        if (!responce || !responce.data.success || !rules) {
            throw new Errors.InvalidInput('Unable to fetch gmaneSettinghelp data');
        }
        if (responce.data.message === MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE) {
            logger.info(userId, `Server under the maintenance.`)
            throw new Errors.UnknownError('Unable to fetch gmaneSettinghelp data');
        }
        return rules;

    } catch (error : any) {
        logger.error(userId, 'CATCH_ERROR : gmaneSettinghelp :: ', gameId, token, " - ", error);
        logger.error(userId, "error.response.data ", error.response.data);

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
    gameSettinghelp,
};

export = exportedObj; 