import cardsSchema from "./helper/cardsSchema";
import Joi from "joi"


const formatdiscardCardInfoSchema = Joi.object().keys({
    userId: Joi.string().required().description("user Id"),
    tableId: Joi.string().required().description("table Id"),
    seatIndex: Joi.number().required().description("seat Index"),
    totalPoints: Joi.number().required().description("total Points"),
    cards: Joi.array().items(cardsSchema).required().description("cards"),
    discardCard: Joi.array().required().description("discard Card"),
    opendDeck : Joi.array().items(Joi.string().required()).default([]).required().description("opendDeck"),
}).unknown(true);

export = formatdiscardCardInfoSchema;

