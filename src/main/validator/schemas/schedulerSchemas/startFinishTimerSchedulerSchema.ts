import Joi from "joi"


const startFinishTimerSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    userId: Joi.string().required().description("user Id"),
    currentRound: Joi.number().description('current Round'),
}).unknown(true);

export = startFinishTimerSchedulerSchema;