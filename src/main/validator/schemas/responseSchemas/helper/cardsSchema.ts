import Joi from "joi"

const cardsSchema = Joi.object().keys({
    group: Joi.array().items(Joi.string()).required(),
    groupType: Joi.string().required(),
    cardPoints: Joi.number().required()
}).unknown(true)


export = cardsSchema