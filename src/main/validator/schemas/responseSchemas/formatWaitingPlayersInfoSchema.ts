import Joi from "joi"

const formatWaitingPlayersInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    currentRound: Joi.number().required().description("current Round"),
    timer: Joi.number().required().description("timer"),
    msg: Joi.string().required().description("message"),
}).unknown(true);

export = formatWaitingPlayersInfoSchema;