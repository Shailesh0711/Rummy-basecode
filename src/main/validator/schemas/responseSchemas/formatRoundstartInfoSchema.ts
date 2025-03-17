import Joi from "joi"

const formatRoundstartInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("user Id"),
    // currentRound: Joi.number().required().description("current Round"),
    timer: Joi.number().required().description("timer"),
    msg: Joi.string().required().description("msg"),
}).unknown(true);

export = formatRoundstartInfoSchema;