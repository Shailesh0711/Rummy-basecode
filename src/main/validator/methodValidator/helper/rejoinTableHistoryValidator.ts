import { RejoinTableHistoryIf } from "../../../interfaces/playerPlayingTableIf";
import Joi from "joi"
import logger from "../../../../logger";
import Errors from "../../../errors"
import { rejoinTableHistorySchema } from "../../schemas/methodSchemas";

async function rejoinTableHistoryValidator(
    data: RejoinTableHistoryIf,
): Promise<RejoinTableHistoryIf> {
    try {
        Joi.assert(data, rejoinTableHistorySchema);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : rejoinTableHistoryValidator :: ',
            error,
            '-',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}


export = rejoinTableHistoryValidator