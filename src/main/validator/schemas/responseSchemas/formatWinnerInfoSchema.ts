import Joi from "joi"

const formatWinnerInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    userId: Joi.string().required().description("user Id"),
    seatIndex: Joi.number().required().description("seat Index"),
    winAmount: Joi.number().required().description("win Amount"),
    balance: Joi.number().required().description("balance"),
}).unknown(true);

export = formatWinnerInfoSchema;