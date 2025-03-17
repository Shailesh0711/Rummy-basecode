import Joi from "joi"

const settingManuTableInfoSchema = Joi.object().keys({
    tableId: Joi.string(),
    userId: Joi.string(),
    currentRound: Joi.number(),
})

export = settingManuTableInfoSchema;