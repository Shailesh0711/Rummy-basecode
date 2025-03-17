import Joi from "joi";
import cardsSchema from "./helper/cardsSchema";


const formatDeclareInScoreboardInfoSchema = Joi.array().items(Joi.object().keys({
    userName: Joi.string(),
    userId: Joi.string(),
    seatIndex: Joi.number(),
    profilePicture: Joi.string(),
    DealScore: Joi.number(),
    gameScore: Joi.string(),
    Status: Joi.string(),
    dealType: Joi.number().optional(),
    poolType : Joi.number().optional(),
    socketId: Joi.string(),
    cards: Joi.array().items(cardsSchema),
    message: Joi.string(),
    tableId: Joi.string(),
    isDeclared: Joi.boolean(),
})
);

export = formatDeclareInScoreboardInfoSchema;