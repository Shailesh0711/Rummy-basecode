import Joi from "joi"

const userDetailSchema = Joi.object()
    .keys({

        _id: Joi.string().required().description('user Unique Id'),
        userId: Joi.string().required().description('user Unique Id'),
        username: Joi.string().required().allow('').description('user name'),
        socketId: Joi.string().required().description('User SocketId'),
        profilePicture: Joi.string()
            .required()
            .allow('')
            .description('User Profile Pic'),
        lobbyId: Joi.string().required().allow('').description('lobby id'), 
        oldTableId: Joi.allow().optional().default([]).description('lobby id'), 
        OldLobbyId: Joi.string().optional().allow('').description('lobby id'), 
        isFTUE: Joi.boolean().description('tutorial flag'),
        fromBack: Joi.boolean()
            .default(false)
            .description('backGround ForGround App'),
        gameId: Joi.string().required().description('game id'),
        dealType: Joi.number().required().description('game pool type'),
        gamePoolType: Joi.number().required().description('game pool type'),
        maximumSeat: Joi.number().integer().greater(0).required().description('max seats'),
        minPlayer: Joi.number().integer().greater(0).required().description('max seats'),
        balance: Joi.number().required().allow(null).description('user balance'),
        bootAmount: Joi.number().required().description('Boot Ammount Of Playing'),
        isBot: Joi.boolean().description('isBot'),
        location: Joi.object().keys({
            latitude: Joi.number(),
            longitude: Joi.number()
        }).optional(),
        moneyMode: Joi.string().required().allow("").description('Unique Auth Token'),
        rummyType: Joi.string().required().description('Unique Auth Token'),
        authToken: Joi.string().required().description('Unique Auth Token'),
        createdAt: Joi.date().description("createAt"),
        updatedAt: Joi.date().description("update timer"),
        platformCommission : Joi.number().required().description('rake'),
        isSplit : Joi.boolean().description('is Split available'),
    }).unknown(true);

export = userDetailSchema;