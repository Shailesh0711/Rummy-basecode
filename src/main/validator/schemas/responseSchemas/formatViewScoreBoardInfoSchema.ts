import Joi from "joi"
import cardsSchema from "./helper/cardsSchema"


const formatViewScoreBoardInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    trumpCard: Joi.array().items(Joi.string().allow("")).required().description("trump card"),
    scoreBoradTable: Joi.array().items(
        Joi.object().keys({
            userName: Joi.string(),
            userId: Joi.string(),
            seatIndex: Joi.number(),
            profilePicture: Joi.string(),
            DealScore: Joi.number(),
            gameScore: Joi.number(),
            Status: Joi.string(),
            socketId: Joi.string(),
            poolType: Joi.number(),
            cards: Joi.array().items(cardsSchema),
        })
    ).required().description("Scoreboard information")
}).unknown(true);

export = formatViewScoreBoardInfoSchema;