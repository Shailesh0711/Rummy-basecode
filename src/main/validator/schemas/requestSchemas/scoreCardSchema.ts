import Joi from "joi";



const scoreCardSchema = Joi.object({
    tableId: Joi.string(),
    userId: Joi.string(),
    currentRound: Joi.number(),
})

export = scoreCardSchema;