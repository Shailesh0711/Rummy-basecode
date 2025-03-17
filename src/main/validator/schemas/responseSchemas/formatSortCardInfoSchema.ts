import Joi from "joi"
import cardsSchema from "./helper/cardsSchema";

const formatSortCardInfoSchema = Joi.object().keys({
    userId: Joi.string().required().description("user Id"),
    tableId: Joi.string().required().description("table Id"),
    totalPoints: Joi.number().required().description("total Points"),
    cards: Joi.array().items(cardsSchema).required().description("cards")
}).unknown(true);


export = formatSortCardInfoSchema;