import axios from "axios";
import commonEventEmitter from "../commonEventEmitter";
import Errors from "../errors";
import { EVENTS, MESSAGES, NUMERICAL, REDIS } from "../../constants";
import logger from "../../logger";
import config from "../../connections/config";
import { decrCounter } from "../gamePlay/cache/onlinePlayer";

async function verifyUserProfile(
  token: string,
  gameId: string,
  socketId: string,
  userId: string
): Promise<any> {
  const { VERIFY_USER_PROFILE, APP_KEY, APP_DATA } = config();
  logger.debug(userId, "verifyUserProfile :: ", token, "gameId ::>>", gameId);
  try {
    const url = VERIFY_USER_PROFILE;
    logger.info(userId, "APP_KEY :: ", APP_KEY, "APP_DATA :: ", APP_DATA);
    let responce = await axios.post(
      url,
      { gameId: gameId },
      {
        headers: {
          Authorization: `${token}`,
          "x-mgpapp-key": APP_KEY,
          "x-mgpapp-data": APP_DATA,
        },
      }
    );
    logger.info(userId, "verifyUserProfile : responce :: ", responce.data);

    const result = responce.data.data;
    logger.info(userId, "resData : result :: ", result);

    if (!responce || !result) {
      throw new Error("Unable to fetch verify User Profile data");
    } else if (result.isValidUser === false) {
      logger.info(userId, "isValidUser  ==>> ", result.isValidUser);
      await decrCounter(REDIS.PREFIX.ONLINEPLAYER);
      throw new Errors.InvalidInput("Unable to fetch verify User Profile data");
    }
    if (responce.data.message === MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE) {
      logger.info(userId, `Server under the maintenance.`);
      throw new Errors.UnknownError("Unable to fetch verify User Profile data");
    }
    return result;
  } catch (error: any) {
    logger.error(userId, "CATCH_ERROR : getUserProfile :: ", token, "-", error);

    if (error instanceof Errors.UnknownError) {
      let nonProdMsg = "Server under the maintenance!";
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
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
    } else if (
      error.response &&
      error.response.data &&
      !error.response.data.success
    ) {
      let nonProdMsg = "Fetch data failed!";
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket: socketId,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: nonProdMsg,
          message: error.response.data.message
            ? error.response.data.message
            : MESSAGES.ERROR.COMMON_ERROR,
          buttonCounts: NUMERICAL.ONE,
          button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
          button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
          button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        },
      });
    } else {
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
    return true;
  }
}

const exportedObj = {
  verifyUserProfile,
};
export = exportedObj;
