import Joi from "joi";


const formatSignupAckSchema = Joi.object().keys({
    signupResponse: Joi.object().keys({
        _id: Joi.string(),
        un: Joi.string(),
        pp: Joi.string(),
        socketid: Joi.string(),
        tableId: Joi.string().allow(""),
        gameId: Joi.string().allow(""),
        lobbyId: Joi.string().allow(""),
        isFTUE: Joi.boolean().description('tutorial flag'),
        chips: Joi.number(),
        isPlay: Joi.boolean(),
        fromBack: Joi.boolean()
            .default(false)
            .description('backGround ForGround App'),
        dealType: Joi.number().required().description('game pool type'),
        gamePoolType: Joi.number().required().description('game pool type'),
        isRobot: Joi.boolean(),
        latitude: Joi.number().optional(),
        longitude: Joi.number().optional(),
        entryFee: Joi.number(),
        maximumSeat: Joi.number(),
        maxTableCreateLimit: Joi.number(),
        rummyType: Joi.string(),
        authToken: Joi.string().required().description('Unique Auth Token'),
    }),
    gameTableInfoData: Joi.array().items(
        Joi.object().keys({
            tableId: Joi.string(),
            minimumSeat: Joi.number(),
            maximumSeat: Joi.number(),
            entryFee: Joi.number(),
            gameType: Joi.string(),
            seatIndex: Joi.number(),
            activePlayers: Joi.number(),
            gameStartTimer: Joi.number(),
            turnTimer: Joi.number(),
            tableState: Joi.string(),
            closedDeck: Joi.array().default([]),
            opendDeck: Joi.array().default([]),
            turnCount: Joi.number(),
            dealerPlayer: Joi.number(),
            declareingPlayer: Joi.string().allow(""),
            validDeclaredPlayer: Joi.string().allow(""),
            validDeclaredPlayerSI: Joi.number(),
            playersDetail: Joi.array().items(
                Joi.object().keys({
                    _id: Joi.string().optional(),
                    userId: Joi.string().optional(),
                    username: Joi.string().optional(),
                    profilePicture: Joi.string().optional(),
                    seatIndex: Joi.number().optional(),
                    userStatus: Joi.string().optional(),
                    inGame: Joi.boolean().optional(),
                    gameScore: Joi.number().optional(),
                })
            ),
            playersCount: Joi.number(),
        })
    ),
    reconnect: Joi.boolean()
});


export = formatSignupAckSchema;