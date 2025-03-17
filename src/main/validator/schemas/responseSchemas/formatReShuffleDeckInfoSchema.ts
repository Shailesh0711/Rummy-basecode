import Joi from "joi"

const formatReShuffleDeckInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    opendDeck : Joi.array().items(Joi.string().required()).default([]).required().description("opendDeck"),
    // closedDeck: Joi.array().items(Joi.string()).required().description("opendDeck")
}).unknown(true);

export = formatReShuffleDeckInfoSchema;