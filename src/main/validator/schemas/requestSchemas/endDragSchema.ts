import Joi from "joi";


const endDragSchema = Joi.object().keys({
    userId : Joi.string().required().description("user id"),
    tableId : Joi.string().required().description("table Id"),
    currentRound : Joi.number().required().description("current Round"),
    cards : Joi.array().items(Joi.string()).required().description("move card"),
    destinationGroupIndex: Joi.number().required().required().description("card moveing destination group index"),
}).unknown(true);

export = endDragSchema