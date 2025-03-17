import Joi from "joi";

const formatShowOpenDeckCardsInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table id"),
    opendDeck: Joi.array().items(Joi.string()).required().description("open deck all cards")
}).unknown(true)

export = formatShowOpenDeckCardsInfoSchema;