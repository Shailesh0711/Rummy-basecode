import Joi from "joi";

const scoreBoardTimerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    currentRound: Joi.number().description('current Round'),
    isAutoSplit: Joi.boolean().description('is Auto Split'),
}).unknown(true);

export = scoreBoardTimerSchema;