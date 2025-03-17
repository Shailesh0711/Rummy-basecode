import Joi from "joi";
import cardsSchema from "./helper/cardsSchema";

const formatFinishTimerStartSchema = Joi.object().keys({
    userId: Joi.string().required().description("user Id"),
    tableId: Joi.string().required().description("table Id"),
    seatIndex: Joi.number().required().description("seat Index"),
    turnTimer: Joi.number().required().description("turn Timer"),
    totalScorePoint: Joi.number().required().description("total Score Point"),
    cards: Joi.array().items(cardsSchema).required().description("cards"),
    finishCard: Joi.array().allow("").description("finish Card")
}).unknown(true);

export = formatFinishTimerStartSchema;