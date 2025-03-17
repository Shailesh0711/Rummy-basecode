import Joi from "joi"
import logger from "../../../../logger";
import Errors from "../../../errors"
import { setTableQueueSchema } from "../../schemas/methodSchemas";

async function setTableQueueValidator(
    data: string[]
): Promise<string[]> {
    try {
        Joi.assert(data, setTableQueueSchema);
        return data;
    } catch (error) {
        logger.error('CATCH_ERROR : roundTableValidator :: ', error, '-', data);
        throw new Errors.CancelBattle(error);
    }
}


export = setTableQueueValidator