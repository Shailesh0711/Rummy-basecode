import Joi from "joi"

const seatsSchema = Joi.object()
    .keys({
        _id: Joi.string().allow("").description('user Unique Id'),
        userId: Joi.string().allow("").description('user Unique Id'),
        username: Joi.string().allow('').description('user name'),
        profilePicture: Joi.string().allow('').description('user profile pic'),
        seatIndex: Joi.number().description('user seat index'),
        userStatus: Joi.string().allow('').description('user game playing status'),
        inGame: Joi.boolean().optional().description('user game playing status'),
        gameScore: Joi.number().optional().description('user game playing status'),
    })
    .optional()
    .unknown(true);

export = seatsSchema;