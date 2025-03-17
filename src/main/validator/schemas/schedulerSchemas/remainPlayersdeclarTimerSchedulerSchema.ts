import Joi from "joi"

const remainPlayersdeclarTimerSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    currentRound: Joi.number().description('current Round'),
    otherPlayerDeclares: Joi.array().items(
        Joi.object().keys({
            userId: Joi.string().optional(),
            seatIndex: Joi.number().optional()
        })).optional().default([]).description("other Player Declares")
}).unknown(true);

export = remainPlayersdeclarTimerSchedulerSchema;