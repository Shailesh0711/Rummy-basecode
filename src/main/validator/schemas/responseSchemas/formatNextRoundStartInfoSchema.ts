import Joi from "joi";

const formatNextRoundStartInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table id"),
    timer: Joi.number().required().description("next round timer"),
    message: Joi.string().required().description("message"),
}).unknown(true);

export = formatNextRoundStartInfoSchema;