import Joi from "joi";

const leaveTableTimerSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    userId: Joi.string().required().description('user Id'),
    currentRound: Joi.number().description('exipire time'),
}).unknown(true);

export = leaveTableTimerSchedulerSchema;