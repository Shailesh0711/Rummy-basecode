import Joi from "joi";

const rejoinGamePopupSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    currentRound: Joi.number().description('exipire time'),
    playersId: Joi.array().items(Joi.string()).default([])
}).unknown(true);

export = rejoinGamePopupSchedulerSchema;
