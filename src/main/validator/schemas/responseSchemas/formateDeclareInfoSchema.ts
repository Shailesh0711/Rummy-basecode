import Joi from "joi";


const formateDeclareInfoSchema = Joi.object().keys({
    declareUserId: Joi.string().required().description("declare player User Id"),
    declareSeatIndex: Joi.number().required().description("declare player Seat Index"),
    timer: Joi.number().description("timer"),
    tableId: Joi.string().required().description("table Id"),
    isValidDeclared: Joi.boolean().required().description("isValidDeclared"),
    massage: Joi.string().required().description("massage"),
    startDeclarTimerUser: Joi.array().items(Joi.object().keys({
        userId: Joi.string().optional().description("user"),
        seatIndex: Joi.number().optional().description("user"),
    })).default([]).optional().description("start DeclarTimer User"),
    openDeck: Joi.array().default([]).optional().description("openDeck"),
    totalPoints : Joi.number(),
}).unknown(true);

export = formateDeclareInfoSchema;