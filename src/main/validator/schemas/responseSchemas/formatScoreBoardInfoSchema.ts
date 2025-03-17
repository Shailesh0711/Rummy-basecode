import Joi from "joi";
import cardsSchema from "./helper/cardsSchema";

const formatScoreBoardInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    timer: Joi.number().required().description("cards"),
    message: Joi.string().required().description("message"),
    trumpCard: Joi.array().items(Joi.string().allow("")).required().description("trump Card"),
    isSplitAmount: Joi.boolean().required().description("is Split Amount"),
    isLastDeal: Joi.boolean().required().description("is Split Amount"),
    isLeaveBtn: Joi.boolean().required().description("isLeaveBtn"),
    scoreBoradTable: Joi.array().items(
        Joi.object().keys({
            userName: Joi.string(),
            userId: Joi.string(),
            seatIndex: Joi.number(),
            profilePicture: Joi.string(),
            DealScore: Joi.number(),
            gameScore: Joi.string(),
            Status: Joi.string(),
            dealType: Joi.number().optional(),
            poolType: Joi.number().optional(),
            socketId: Joi.string(),
            cards: Joi.array().items(cardsSchema),
            message: Joi.string(),
            tableId: Joi.string(),
            isDeclared: Joi.boolean(),
        })
    ).required().description("score Borad Table"),

}).unknown(true);


export = formatScoreBoardInfoSchema;