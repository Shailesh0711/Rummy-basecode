import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { formatPickupCloseDeckIf } from "../../interfaces/responseIf";
import { formatPickupCloseDeckSchema } from "../schemas/responseSchemas";

async function formatPickupCloseDeckValidator(
    data: formatPickupCloseDeckIf
): Promise<formatPickupCloseDeckIf> {
    try {
        Joi.assert(data, formatPickupCloseDeckSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatPickupCloseDeckValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatPickupCloseDeckValidator;