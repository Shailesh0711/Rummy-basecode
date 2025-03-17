import Joi from "joi";

const formatPlayerSplitAmountDetailsSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table id"),
    message: Joi.string().required().description("message"),
    title: Joi.string().allow("").description("message"),
    timer: Joi.number().required().description("timer"),
    playersSplitAmountDetails: Joi.array().items(Joi.object().keys({
        userId: Joi.string().required().description("user Id"),
        amount: Joi.number().required().description("amount"),
        splitStatus: Joi.string().required().description("split Status"),
        remainDrops: Joi.number().required().description("remain Drops"),
        socketId: Joi.string().required().description("split Status"),
        userName: Joi.string().required().description("user name"),
        gameScore: Joi.number().required().description("game Score"),
    }))
});

export = formatPlayerSplitAmountDetailsSchema;