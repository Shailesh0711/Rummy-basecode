import Joi from "joi";

const formatBootCollectionInfoSchema = Joi.object().keys({
    // userId: Joi.string().required().description("userId"),
    // seatIndex: Joi.number().required().description("seat Index"),
    // bootAmount: Joi.number().required().description("boot Amount"),
    winPrice: Joi.number().required().description("winPrice"),
    balance: Joi.number().required().description("balance"),
    listOfSeatsIndex :Joi.array().items(Joi.number()).required()
}).unknown(true);


export = formatBootCollectionInfoSchema