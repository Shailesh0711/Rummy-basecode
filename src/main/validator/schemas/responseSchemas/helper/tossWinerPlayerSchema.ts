import Joi from "joi";


const tossWinnerPlayerSchema = Joi.object().keys({
    userId: Joi.string().required(),
    seatIndex: Joi.number().required(),
    username: Joi.string().required(),
    card: Joi.string().required(),
    message: Joi.string().optional(),
})



export = tossWinnerPlayerSchema