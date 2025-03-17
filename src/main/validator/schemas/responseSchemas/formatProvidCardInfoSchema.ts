import Joi from "joi"
import cardsSchema from "./helper/cardsSchema"

const formatProvidCardInfoSchema = Joi.object().keys({
    trumpCard: Joi.array().items(Joi.string().allow("")).required().description("trump Card"),
    openDeckCard: Joi.array().items(Joi.string()).required().description("Open Deck Card"),
    totalPoint: Joi.number().required().description("Total Point"),
    cards: Joi.array().items(cardsSchema).required().description("cards"),
    // closeDeckCard: Joi.array().items(Joi.string()).required().description("close Deck Card"),
}).unknown(true);

export = formatProvidCardInfoSchema