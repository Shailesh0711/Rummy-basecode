import Joi, { date } from "joi"


const reShuffleCardsSchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    currentTurnPlayerId : Joi.string().allow("").description('current Turn Player Id'),
    currentRound: Joi.number().description('current Round'),
    currentPlayerSeatIndex: Joi.number().description('current Player Seat Index'),
}).unknown(true);

export = reShuffleCardsSchedulerSchema;