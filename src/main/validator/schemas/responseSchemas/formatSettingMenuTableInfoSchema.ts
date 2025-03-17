import Joi from "joi";



const formatSettingMenuTableInfoSchema = Joi.object().keys({
    tableId: Joi.string(),
    gameType: Joi.string(),
    variant: Joi.string(),
    numberOfDeck: Joi.number(),
    printedJoker: Joi.string(),
    printedValue: Joi.number(),
    drop: Joi.object().keys({
        FRIST_DROP: Joi.string(),
        MIDDLE_DROP: Joi.string(),
        LAST_DROP: Joi.string().allow(""),
    })
})

export = formatSettingMenuTableInfoSchema;