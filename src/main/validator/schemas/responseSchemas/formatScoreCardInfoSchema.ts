import Joi from "joi";

const formatScoreCardInfoSchema = Joi.object({
    title : Joi.array().items(),
    roundScore : Joi.array().items(),
    totalScore : Joi.array().items(),
    rows : Joi.number(),
})

export = formatScoreCardInfoSchema;