import config from "../../../connections/config";
import logger from "../../../logger";
const jwt = require('jsonwebtoken');
const CryptoJS = require("crypto-js");

const { SECRET_KEY } = config();

export async function auth(authKey: string):Promise<any> {
    try {
        logger.info('authKey :>> ', authKey, "SECRET_KEY :: ", SECRET_KEY);
        let bytes = CryptoJS.AES.decrypt(authKey, SECRET_KEY);
        let gameId = bytes.toString(CryptoJS.enc.Utf8);
        logger.info('gameId ::>> ', gameId);
      
        if(!gameId) {
            const resObj = {
                status: 400,
                message: "oops ! Something want wrong",
                data: null
            }
            return resObj;
        }else {
            const resObj = {
                status: 200,
                message: "data fetched",
                data: gameId
            }
            return resObj
        }
    } catch (error) {
        logger.error('auth :>> ', error);
    }
};