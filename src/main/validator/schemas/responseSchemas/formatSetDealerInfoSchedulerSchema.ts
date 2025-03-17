import Joi from "joi";

const formatSetDealerInfoSchedulerSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    userId: Joi.string().required().description("user Id"),
    username:Joi.string().required().description("user name"),
    seatIndex: Joi.number().required().description("seat Index"),
    currentRound: Joi.number().required().description("current Round"),
}).unknown(true);

export = formatSetDealerInfoSchedulerSchema