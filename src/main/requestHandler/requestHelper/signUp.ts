import logger from "../../../logger";
import { signUpHelperRequestIf } from "../../interfaces/requestIf";
import Validator from "../../validator";
import Errors from "../../errors";
import commonEventEmitter from "../../commonEventEmitter";
import { EVENTS, MESSAGES, NUMERICAL, PRODUCTION } from "../../../constants";
import defaultSignUpData from "./helpers/defaultSignUp";
import { userSignUpIf } from "../../interfaces/userSignUpIf";
import { signUp } from "../../gamePlay";
import config from "../../../connections/config";
import { checkMaintanence } from "../../clientsideapi/checkMaintanence";
import { verifyUserProfile } from "../../clientsideapi/verifyUserProfile";
import { firstTimeIntrection } from "../../clientsideapi/firstTimeIntrection";

async function signUpHandler(
  { data: signUpData }: signUpHelperRequestIf,
  socket: any,
  ack: Function
): Promise<void> {
  logger.info("=================>> signUpHandler <<====================");
  try {
    // // for check server maintanece or not
    let checkMaintanenceData = await checkMaintanence(
      socket.authToken,
      socket.id,
      signUpData.userId
    );
    logger.info("checkMaintanenceData :::", checkMaintanenceData);
    if (checkMaintanenceData && checkMaintanenceData.isMaintenance) {
      throw new Errors.maintanenceError("Server under the maintenance!");
    }

    // for user profile verification client api
    let isValidUserData = await verifyUserProfile(
      socket.authToken,
      signUpData.gameId,
      socket.id,
      signUpData.userId
    );
    logger.info(signUpData.userId, "isValidUserData :: >> ", isValidUserData);

    signUpData = await Validator.requestValidator.signUpValidator(signUpData);
    logger.info("------>> SignUpHandler :: signUpData :: ", signUpData);
    socket.userId = signUpData.userId;

    //for check FTUE (first time user experience)
    if (signUpData.isFTUE) {
      await firstTimeIntrection(
        signUpData.gameId,
        socket.authToken,
        socket.id,
        signUpData.userId,
        signUpData.gameModeId
      );
      signUpData.isFTUE = false;
    }

    const data: userSignUpIf = defaultSignUpData(signUpData, socket);
    logger.info("------>> signUpHandler :: defaultSignUpData :: ==>>", data);

    await signUp.userSignUp(data, socket, ack);
  } catch (error: any) {
    logger.error("---signUpHandler :: ERROR ::", error);
    let nonProdMsg = "";
    let errorCode = 500;
    let msg = MESSAGES.GRPC_ERRORS.COMMON_ERROR;

    if (error instanceof Errors.InvalidInput) {
      nonProdMsg = "Invalid Input";
      logger.error(
        "--- signUpHandler :: Invalid Input :: ERROR ::",
        error,
        "userId",
        signUpData.userId
      );
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: nonProdMsg,
          message: MESSAGES.GRPC_ERRORS.INVALID_INPUT_ERROR,
          buttonCounts: NUMERICAL.ONE,
          button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
          button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
          button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        },
      });
    } else if (error instanceof Errors.CancelBattle) {
      logger.error(
        "--- signUpHandler :: CancelBattle :: ERROR ::",
        error,
        "userId :: ",
        signUpData.userId
      );
      nonProdMsg = "CancelBattle";
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket,
        data: {
          isPopup: true,
          popupType: MESSAGES.POPUP.COMMAN_TOAST_POPUP
            .CANCEL_BATTELE_POPUP_MESSAGE
            ? MESSAGES.POPUP.COMMAN_TOAST_POPUP.CANCEL_BATTELE_POPUP_MESSAGE
            : MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: nonProdMsg,
          message:
            error && error.message && typeof error.message === "string"
              ? error.message
              : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
          buttonCounts: NUMERICAL.ONE,
          button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
          button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
          button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        },
      });
    } else if (error instanceof Errors.UnknownError) {
      nonProdMsg = "GRPC_FAILED";
      logger.error(
        "--- signUpHandler :: UnknownError :: ERROR ::",
        error,
        "userId",
        signUpData.userId
      );

      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket,
        data: {
          isPopup: true,
          popupType: MESSAGES.POPUP.COMMAN_TOAST_POPUP
            .INVALID_INPUT_POPUP_MESSAGE
            ? MESSAGES.POPUP.COMMAN_TOAST_POPUP.INVALID_INPUT_POPUP_MESSAGE
            : MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: nonProdMsg,
          message:
            error && error.message && typeof error.message === "string"
              ? error.message
              : MESSAGES.GRPC_ERRORS.COMMON_ERROR,
          buttonCounts: NUMERICAL.ONE,
          button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
          button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
          button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
        },
      });
    } else {
      logger.error(
        "--- signUpHandler :: commonError :: ERROR ::",
        error,
        "userId",
        signUpData.userId
      );
      commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
        socket,
        data: {
          isPopup: true,
          popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
          title: MESSAGES.ERROR.SIGN_UP_ERROR_MESSAGE,
          message:
            error && error.message && typeof error.message === "string"
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

export = signUpHandler;
