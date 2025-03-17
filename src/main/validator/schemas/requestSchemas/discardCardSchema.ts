import Joi from "joi"

const discardCardSchema = Joi.object().keys({
    userId : Joi.string().required().description("user id"),
    tableId : Joi.string().required().description("table Id"),
    currentRound : Joi.number().required().description("current Round"),
    cards: Joi.array().items(Joi.string()).required().description("cards")
}).unknown(true);

export = discardCardSchema;