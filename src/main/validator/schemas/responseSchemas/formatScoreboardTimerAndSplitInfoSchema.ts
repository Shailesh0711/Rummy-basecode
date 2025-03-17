import Joi from "joi";



const formatScoreboardTimerAndSplitInfoSchema = Joi.object().keys({
    timer : Joi.number().required(),
    message : Joi.string().required(),
    isSplit : Joi.boolean().required(),
    splitUsers : Joi.array().items(Joi.object().keys({
        userId : Joi.string().optional(),
        seatIndex : Joi.number().optional(),
    })).default([]),
    isLeaveBtn : Joi.boolean().required(),
}).unknown(true)


export = formatScoreboardTimerAndSplitInfoSchema;