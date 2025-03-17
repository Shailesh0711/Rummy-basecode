import Joi from "joi";

const formatSingUpInfoSchema = Joi.object().keys({
    _id: Joi.string().required().description('user Unique Id'),
    userId: Joi.string().required().description('user Unique Id'),
    username: Joi.string().required().allow('').description('user name'),
    socketId: Joi.string().required().description('User SocketId'),
    profilePicture: Joi.string()
        .required()
        .allow('')
        .description('User Profile Pic'),
    lobbyId: Joi.string().required().allow('').description('lobby id'),
    isFTUE: Joi.boolean().description('tutorial flag'),
    inPlay: Joi.boolean().optional().description('playing table open or not'),
    fromBack: Joi.boolean()
        .default(false)
        .description('backGround ForGround App'),
    gameId: Joi.string().required().description('game id'),
    dealType: Joi.number().required().description('game pool type'),
    tableId: Joi.string().allow("").optional(),
    maximumSeat: Joi.number().integer().greater(0).required().description('max seats'),
    balance: Joi.number().required().allow(null).description('user balance'),
    bootAmount: Joi.number().required().description('Boot Ammount Of Playing'),
    isBot: Joi.boolean().description('isBot'),
    location: Joi.object().keys({
        latitude: Joi.number(),
        longitude: Joi.number()
    }).optional(),
    authToken: Joi.string().required().description('Unique Auth Token'),
}).unknown(true);

export = formatSingUpInfoSchema;

