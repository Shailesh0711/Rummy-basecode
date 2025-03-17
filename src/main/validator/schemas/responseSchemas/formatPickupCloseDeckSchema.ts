import Joi from "joi"
import cardsSchema from "./helper/cardsSchema";

const formatPickupCloseDeckSchema = Joi.object().keys({
    userId: Joi.string().required().description("user Id"),
    tableId: Joi.string().required().description("table Id"),
    seatIndex: Joi.number().required().description("seat Index"),
    totalPoints: Joi.number().required().description("total Points"),
    cards: Joi.array().items(cardsSchema).required().description("cards"),
    pickUpCard: Joi.string().required().description("pickUp Card"),
}).unknown(true);


export = formatPickupCloseDeckSchema;