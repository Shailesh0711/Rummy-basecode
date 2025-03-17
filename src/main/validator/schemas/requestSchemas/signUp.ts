import Joi from "joi"

const signUpSchema = Joi.object().keys({
    userName: Joi.string().required().description('user name'),
    userId: Joi.string().required().description('user id'),
    profilePic: Joi.string().required().allow('').description('user profilePic'),
    lobbyId: Joi.string().required().allow('').description('lobby id'),
    isFTUE: Joi.boolean().required().description('tutorial flag'),
    fromBack: Joi.boolean(),
    dealType: Joi.string().allow("").description('game pool type'),
    gamePoolType: Joi.string().allow("").description('game pool type'),
    gameId: Joi.string().required().description('game id'),
    minPlayer: Joi.number().integer().greater(0).required().description('max seats'),
    noOfPlayer: Joi.number().integer().greater(0).required().description('max seats'),
    accessToken: Joi.string().required().description('access Token'),
    isUseBot: Joi.boolean().description('isBot'),
    entryFee: Joi.number().required().description('bootAmount'),
    moneyMode: Joi.string().required().optional().allow('').description('table id'),
    rummyType: Joi.string().required().optional().allow('').description('table id'),
    latitude: Joi.string().required().description('latitude'),
    longitude: Joi.string().required().description('longitude'),
    platformCommission: Joi.number().optional().description('bootAmount'),
    gameModeId: Joi.string().allow("").required().description('gameModeId'),
    isSplit : Joi.boolean(),
}).unknown(true);

export default signUpSchema
