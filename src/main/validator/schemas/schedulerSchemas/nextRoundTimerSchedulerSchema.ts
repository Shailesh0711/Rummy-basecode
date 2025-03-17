import Joi from "joi";

const nextRoundTimerSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    currentRound: Joi.number().description('exipire time'),
}).unknown(true);

export = nextRoundTimerSchedulerSchema;