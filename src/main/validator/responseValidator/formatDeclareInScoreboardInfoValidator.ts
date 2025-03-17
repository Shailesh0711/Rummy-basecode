import Joi from "joi"
import logger from "../../../logger";
import Errors from "../../errors";
import { UserInfoIf } from "../../interfaces/scoreBoardIf";
import formatDeclareInScoreboardInfoSchema from "../schemas/responseSchemas/formatDeclareInScoreboardInfoSchema";


async function formatDeclareInScoreboardInfoValidator(
    data: UserInfoIf[]
): Promise<UserInfoIf[]> {
    try {
        Joi.assert(data, formatDeclareInScoreboardInfoSchema);
        return data;
    } catch (error) {
        console.log(error);
        logger.error(
            'CATCH_ERROR : formatDeclareInScoreboardInfoValidator :: ',
            error,
            ' - ',
            data,
        );
        throw new Errors.CancelBattle(error);
    }
}

export = formatDeclareInScoreboardInfoValidator;