import Joi from "joi"

const dropRoundSchema = Joi.object().keys({
    userId : Joi.string().required().description("user id"),
    tableId : Joi.string().required().description("table Id"),
    currentRound : Joi.number().required().description("current Round"),
    dealType: Joi.number().optional().description("deal type"),
    poolType: Joi.number().optional().description("pool Type"),
}).unknown(true);

export = dropRoundSchema;