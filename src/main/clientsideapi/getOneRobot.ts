// import axios from "axios";
// import logger from '../logger';
// import { getConfig } from "../../config";
// import { getOneRobotRes } from "../interface/cmgApiIf";
// import CommonEventEmitter from "../commonEventEmitter";
// import Errors from "../errors";
// import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
// const { GET_ONE_ROBOT, APP_KEY, APP_DATA } = getConfig();

// async function getOneRobot(tournamentId: string, token: string, tableId: string) {
//     logger.debug(tableId, "getOneRobot :: ", tournamentId, token)
//     try {

//         const url = GET_ONE_ROBOT;
//         let responce = await axios.post(url, { tournamentId }, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key':APP_KEY, 'x-mgpapp-data':APP_DATA } });
//         logger.info(tableId, "getOneRobot : responce :: ", responce.data);

//         let getOneRobotDetail = responce.data;
//         logger.info(tableId, "resData : getOneRobotDetail :: ", getOneRobotDetail);

//         if (!responce || !responce.data.success || !getOneRobotDetail) {
//             throw new Errors.InvalidInput('Unable to fetch robot data');
//         }
//         else if (getOneRobotDetail.data.isBotAvailable === false) {
//             throw new Errors.InvalidInput("isBotAvailable false");
//         }
//         if (responce.data.message === MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE) {
//             logger.info(tableId, `Server under the maintenance.`)
//             throw new Errors.UnknownError('Unable find user profile failed!');
//         }

//         return getOneRobotDetail.data.botDetails;

//     } catch (error : any) {

//         logger.error(tableId, 'CATCH_ERROR :  getOneRobot :>> ', tournamentId, token, "-", error);
//         logger.error(tableId, "error.response.data ", error.response.data);

//         // if (error instanceof Errors.UnknownError) {
//         //     let nonProdMsg = "Server under the maintenance!";
//         //     CommonEventEmitter.emit(EVENTS.SHOW_POPUP, {
//         //         socket: socketId,
//         //         data: {
//         //             isPopup: true,
//         //             popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
//         //             title: nonProdMsg,
//         //             message: MESSAGES.ERROR.SERVER_UNDER_THE_MAINTENANCE,
//         //             buttonCounts: NUMERICAL.ONE,
//         //             button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
//         //             button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
//         //             button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
//         //         },
//         //     });
//         // }
//         // else{
//         //     let nonProdMsg = "Fetch data failed!";
//         //     CommonEventEmitter.emit(EVENTS.SHOW_POPUP, {
//         //         socket: socketId,
//         //         data: {
//         //           isPopup: true,
//         //           popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
//         //           title: nonProdMsg,
//         //           message: MESSAGES.ERROR.COMMON_ERROR,
//         //           buttonCounts: NUMERICAL.ONE,
//         //           button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
//         //           button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
//         //           button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
//         //         },
//         //       });
//         // } 
//         throw new Error('Unable to get One Robot data');
        
//     }
// }

// const exportedObj = {
//     getOneRobot,
// };

// export = exportedObj;