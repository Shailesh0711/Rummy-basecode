import Joi from "joi";

const formatSplitDeclareInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table id"),
    playerDetails: Joi.object().keys({
        userId: Joi.string().required().description("user id"),
        winAmount: Joi.number().required().description("win amount"),
        balance: Joi.number().required().description("balance"),
    })
});

export = formatSplitDeclareInfoSchema;