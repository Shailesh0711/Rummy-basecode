import Joi from "joi"

const rejoinGameAgainSchema = Joi.object().keys({
    userId: Joi.string().required().description("user id"),
    tableId: Joi.string().required().description("table Id"),
    currentRound: Joi.number().required().description("current Round"),
}).unknown(true);

export = rejoinGameAgainSchema;
