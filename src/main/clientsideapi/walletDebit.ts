// import axios from "axios";
// import logger from '../logger';
// import { walletDebitIf } from '../interface/cmgApiIf';
// import CommonEventEmitter from "../commonEventEmitter";
// import Errors from "../errors";
// import { getConfig } from "../../config";
// import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
// const { DEDUCT_USER_ENTRY_FEE, APP_KEY, APP_DATA } = getConfig();

// async function wallateDebit(data: walletDebitIf, token: string, socketId: string) {
//   logger.debug("wallateDebit :: ", data, token)
//   try {

//     const url = DEDUCT_USER_ENTRY_FEE;
//     let responce = await axios.post(url, data, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key': APP_KEY, 'x-mgpapp-data': APP_DATA } })
//     logger.info(data.tableId, "wallateDebit : responce :: ", responce.data);

//     let debitAmountDetail = responce.data.data;
//     logger.info(data.tableId, "resData : debitAmountDetail :: ", debitAmountDetail);

//     if (!responce || !responce.data.success || !debitAmountDetail) {
//       throw new Errors.InvalidInput('Unable to fetch collect amount data');
//     }
//     if (responce.data.message === MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE) {
//       throw new Errors.UnknownError('Unable to fetch collect amount data');
//     }
//     return debitAmountDetail;
//   } catch (error: any) {
//     logger.error(data.tableId,'CATCH_ERROR :  wallateDebit :>> ', data, token, "-", error);
//     logger.error(data.tableId,"error.response.data ", error.response.data);

//     if (error instanceof Errors.UnknownError) {
//       let nonProdMsg = "Server under the maintenance!";
//       CommonEventEmitter.emit(EVENTS.SHOW_POPUP, {
//         socket: socketId,
//         data: {
//           isPopup: true,
//           popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
//           title: nonProdMsg,
//           message: MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE,
//           buttonCounts: NUMERICAL.ONE,
//           button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
//           button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
//           button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
//         },
//       });
//     }
//     else if (error.response && error.response.data && !error.response.data.success) {
//       let nonProdMsg = "Fetch data failed!";
//       CommonEventEmitter.emit(EVENTS.SHOW_POPUP, {
//         socket: socketId,
//         data: {
//           isPopup: true,
//           popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
//           title: nonProdMsg,
//           message: error.response.data.message ? error.response.data.message : MESSAGES.ERROR.COMMON_ERROR,
//           buttonCounts: NUMERICAL.ONE,
//           button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
//           button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
//           button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
//         },
//       });
//     }
//     else {
//       let nonProdMsg = "Fetch data failed!";
//       CommonEventEmitter.emit(EVENTS.SHOW_POPUP, {
//         socket: socketId,
//         data: {
//           isPopup: true,
//           popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
//           title: nonProdMsg,
//           message: MESSAGES.ERROR.COMMON_ERROR,
//           buttonCounts: NUMERICAL.ONE,
//           button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
//           button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
//           button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
//         },
//       });
//     }
//     throw new Error('Unable to wallate Debit data');

//   }
// }

// const exportedObj = {
//   wallateDebit,
// };

// export = exportedObj;