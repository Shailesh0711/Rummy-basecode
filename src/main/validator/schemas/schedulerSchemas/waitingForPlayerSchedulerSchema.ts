import Joi from "joi"

const waitingForPlayerSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    queueKey: Joi.string().description('user queue Key'),
    currentRound: Joi.number().description('current Round'),
    lobbyId: Joi.string().description('lobbyId'),
}).unknown(true);

export = waitingForPlayerSchedulerSchema;