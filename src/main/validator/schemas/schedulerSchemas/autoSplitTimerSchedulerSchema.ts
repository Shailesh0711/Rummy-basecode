import Joi from "joi";

const autoSplitTimerSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    currentRound: Joi.number().description('current Round'),
}).unknown(true);

export = autoSplitTimerSchedulerSchema;