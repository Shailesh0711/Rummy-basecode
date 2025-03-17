import axios from 'axios';
import CommonEventEmitter from "../commonEventEmitter";
import Errors from "../errors";
import { EVENTS, MESSAGES, NUMERICAL } from '../../constants';
import logger from '../../logger';
import config from '../../connections/config';


async function getUserOwnProfile(token: string, socketId: string, userId : string): Promise<any> {
  logger.debug(userId, "getUserOwnProfile :: ", token)
  const { GET_USER_OWN_PROFILE, APP_KEY, APP_DATA } = config();
  try {

    const url = GET_USER_OWN_PROFILE
    logger.debug(userId, "getUserOwnProfile url :: ", url)

    const responce = await axios.post(url, {}, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key': APP_KEY, 'x-mgpapp-data': APP_DATA } });
    logger.info(userId, "getUserOwnProfile : responce :: ", responce.data);

    const userProfileDetail = responce.data.data
    logger.info(userId, "resData : userProfileDetail :: ", userProfileDetail);

    if (!responce || !responce.data.success || !userProfileDetail) {
      throw new Errors.InvalidInput('Unable find user profile failed!');
    }
    if (responce.data.message === MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE) {
      logger.info(userId, `Server under the maintenance.`)
      throw new Errors.UnknownError('Unable find user profile failed!');
    }
    return userProfileDetail;

  } catch (error: any) {
    logger.error(userId, "CARCH_ERROR: getUserOwnProfile ::", token, "-", error);
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
      console.log("CARCH_ERROR: ERR>:", error.response.data);
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
    else {
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
    throw new Error('Unable to get User Own Profile data');

  }
}

const exportedObj = {
  getUserOwnProfile,
};

export = exportedObj;
