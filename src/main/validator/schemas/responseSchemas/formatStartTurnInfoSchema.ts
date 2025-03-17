import Joi from "joi"


const formatStartTurnInfoSchema = Joi.object().keys({
    currentTurnUserId: Joi.string().allow("").description("current Turn User Id"),
    currentTurnSI: Joi.number().required().description("current Turn SI"),
    previousTurnSI: Joi.number().required().description("previous Turn SI"),
    turnTimer: Joi.number().required().description("turn Timer"),
    firstTurn: Joi.boolean().optional().description("firstTurn"),
    isSecondaryTurn: Joi.boolean().optional().description("isSecondaryTurn"),
    isSeconderyTurnsRemain: Joi.boolean().optional().description("isSecondaryTurn"),
}).unknown(true);

export = formatStartTurnInfoSchema;