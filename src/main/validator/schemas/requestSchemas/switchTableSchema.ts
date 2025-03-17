import Joi from "joi";


const switchTableSchema = Joi.object().keys({
    tableId: Joi.string(),
    userId: Joi.string(),
    currentRound: Joi.number(),
})

export = switchTableSchema;