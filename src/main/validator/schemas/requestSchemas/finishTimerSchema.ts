import Joi from "joi"

const finishTimerSchema = Joi.object().keys({
    userId : Joi.string().required().description("user id"),
    tableId : Joi.string().required().description("table Id"),
    currentRound : Joi.number().required().description("current Round"),
    finishCard : Joi.array().items(Joi.string().allow("")).description("finishing card"),
}).unknown(true);

export = finishTimerSchema;