import logger from "../../logger";
import axios from "axios";
import Errors from "../errors";
import config from "../../connections/config";
import { multiPlayerDeductEntryFeeForPoolRummyIf } from "../interfaces/clientApiIf";

export async function multiPlayerDeductEntryFeeForPoolRummy(
    data: multiPlayerDeductEntryFeeForPoolRummyIf,
    token: string
) {
    const { MULTI_PLAYER_DEDUCT_ENTRY_FEE_FOR_POOL_RUMMY, APP_KEY, APP_DATA } = config()
    try {
        const { tableId } = data;
        const url = MULTI_PLAYER_DEDUCT_ENTRY_FEE_FOR_POOL_RUMMY;

        logger.info("----->> multiPlayerDeductEntryFeeForPoolRummy :: url :: ", url);
        logger.info("----->> multiPlayerDeductEntryFeeForPoolRummy :: data :: ", data);
        logger.info("----->> multiPlayerDeductEntryFeeForPoolRummy :: token :: ", token);

        let responce = await axios.post(url, data, { headers: { 'Authorization': `${token}`, 'x-mgpapp-key': APP_KEY, 'x-mgpapp-data': APP_DATA } })
        logger.info("multiPlayerDeductEntryFeeForPoolRummy : responce :: ", responce.data);

        let multiPlayerDeductEntryFeeDetails = responce.data.data;
        logger.info(tableId, "resData : multiPlayerDeductEntryFee :: ", multiPlayerDeductEntryFeeDetails);

        if (!responce || !responce.data || !multiPlayerDeductEntryFeeDetails) {
            return false;
        }
        return true;

    } catch (error) {
        logger.error(`--- multiPlayerDeductEntryFeeForPoolRummy :: ERROR :: `, error);
        return false;
    }
}
