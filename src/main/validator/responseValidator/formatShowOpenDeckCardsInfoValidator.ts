import logger from "../../../logger";
import Errors from "../../errors"
import Joi from "joi"
import { formatShowOpenDeckCardsInfoIf } from "../../interfaces/responseIf";
import { formatShowOpenDeckCardsInfoSchema } from "../schemas/responseSchemas";


async function formatShowOpenDeckCardsInfoValidator(
    data: formatShowOpenDeckCardsInfoIf
):Promise<formatShowOpenDeckCardsInfoIf>{
    try{
        Joi.assert(data, formatShowOpenDeckCardsInfoSchema);
        return data
    }catch(error){
        logger.error(
            'CATCH_ERROR : formatShowOpenDeckCardsInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatShowOpenDeckCardsInfoValidator;