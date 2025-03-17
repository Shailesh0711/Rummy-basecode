import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors"
import { formatPickupOpenDeckIf } from "../../interfaces/responseIf";
import { formatPickupOpenDeckSchema } from "../schemas/responseSchemas";

async function formatPickupOpenDeckValidator(
    data: formatPickupOpenDeckIf
): Promise<formatPickupOpenDeckIf> {
    try {
        Joi.assert(data, formatPickupOpenDeckSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatPickupOpenDeckValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatPickupOpenDeckValidator;