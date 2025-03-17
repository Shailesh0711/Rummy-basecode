import logger from "../../../../logger";
import { userIf } from "../../../interfaces/userSignUpIf";
import Joi from "joi"
import Errors from "../../../errors"
import { userDetailSchema } from "../../schemas/methodSchemas";

async function userDetailValidator(
    data: userIf
): Promise<userIf> {
    try {
        Joi.assert(data, userDetailSchema);
        return data;
    } catch (error) {
        console.log(error)
        logger.error('CATCH_ERROR : userDetailValidator :: ', error, '-', data);
        throw new Errors.InvalidInput(error);
    }
}

const exportObject = {
    userDetailValidator,
}

export = exportObject

