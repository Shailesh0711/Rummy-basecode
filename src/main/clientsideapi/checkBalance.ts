import Errors from "../errors";
import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
import logger from "../../logger";
import config from "../../connections/config";
import axios from "axios";
import commonEventEmitter from "../commonEventEmitter";
import { checkBalanceIf } from "../interfaces/clientApiIf";

async function checkBalance(
  data: checkBalanceIf,
  token: string,
  socketId: string,
  userId: string
) {
  logger.debug("checkBalance ", data, token);
  const { CHECK_BALANCE, APP_KEY, APP_DATA } = config();
  try {
    const url = CHECK_BALANCE;
    logger.debug(userId, "checkBalance url :: ", url);
    logger.debug(userId, "APP_KEY : ", APP_KEY, "APP_DATA : ", APP_DATA);
    let responce = await axios.post(url, data, {
      headers: {
        Authorization: `${token}`,
        "x-mgpapp-key": APP_KEY,
        "x-mgpapp-data": APP_DATA,
      },
    });
    logger.info(userId, "resData : checkBalance responce :: ", responce.data);

    let checkBalanceDetail = responce.data.data;
    logger.info(userId, "resData : checkBalanceDetail :: ", checkBalanceDetail);

    if (!responce || !responce.data.success || !checkBalanceDetail) {
      throw new Errors.InvalidInput("Unable to fetch checkBalance data");
    }
    if (responce.data.message === MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE) {
      logger.info(userId, `Server under the maintenance.`);
      throw new Errors.UnknownError("Unable to fetch checkBalance data");
    }
    return checkBalanceDetail;
  } catch (error: any) {
    logger.error(
      userId,
      "CATCH_ERROR :  checkBalance :>> ",
      data,
      token,
      "-",
      error
    );
    logger.error(userId, "error.response.data ", error.response.data);

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
    throw new Error("Unable to check Balance data");
  }
}

const exportedObj = {
  checkBalance,
};

export = exportedObj;
