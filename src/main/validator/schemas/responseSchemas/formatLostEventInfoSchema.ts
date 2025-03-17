import Joi from "joi";

const formatLostEventInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    userId: Joi.string().required().description("user Id"),
    seatIndex: Joi.number().required().description("seat Index"),
}).unknown(true);

export = formatLostEventInfoSchema;