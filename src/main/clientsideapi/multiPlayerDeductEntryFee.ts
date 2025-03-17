import axios from "axios";
import CommonEventEmitter from "../commonEventEmitter";
import Errors from "../errors";
import { EVENTS, MESSAGES, NUMERICAL } from "../../constants";
import logger from "../../logger";
import config from "../../connections/config";
import { multiPlayerDeductEntryFeeIf, multiPlayerDeductEntryFeeResponse } from "../interfaces/clientApiIf";
import { cancelBattle } from "./helper/cancelBattle";


async function multiPlayerDeductEntryFee(data: multiPlayerDeductEntryFeeIf, token: string, socketId: string): Promise<multiPlayerDeductEntryFeeResponse> {
    const tableId = data.tableId;
    logger.info(tableId, "multiPlayerDeductEntryFee :: ", data, token)
    const { MULTI_PLAYER_DEDUCT_ENTRY_FEE, APP_KEY, APP_DATA } = config();
    try {

        const url = MULTI_PLAYER_DEDUCT_ENTRY_FEE;
        logger.info(tableId, "multiPlayerDeductEntryFee :: ", url, url)
        let responce = await axios.post(url, data, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key': APP_KEY, 'x-mgpapp-data': APP_DATA } })
        logger.info("multiPlayerDeductEntryFee : responce :: ", responce.data);

        let multiPlayerDeductEntryFeeDetails = responce.data.data;
        logger.info(tableId, "resData : multiPlayerDeductEntryFee :: ", multiPlayerDeductEntryFeeDetails);

        if (!responce || !responce.data || !multiPlayerDeductEntryFeeDetails) {
            throw new Errors.CancelBattle('Unable to fetch collect amount data');
        }
        return multiPlayerDeductEntryFeeDetails;

    } catch (error: any) {
        logger.error(tableId, "error.response.data ", error);
        logger.error(tableId, 'CATCH_ERROR :  multiPlayerDeductEntryFeeDetails :>> ', data, token, "-", error);

        await cancelBattle(tableId);
        throw new Errors.CancelBattle("get multi Player Deduct Entry Fee fail");

    }
}

const exportedObj = {
    multiPlayerDeductEntryFee,
};

export = exportedObj;