import Joi from "joi"

const playingTableSchema = Joi.object()
    .keys({
        _id: Joi.string().required().description('Table Unique Id'),
        gameType: Joi.string().required().description('Game Type'),
        dealType: Joi.number().required().description('Game deal type'),
        totalRounds: Joi.number().required().description('total Rounds'),
        totalPlayers: Joi.number().required().description('total Players'),
        maximumSeat: Joi.number().required().description('max Seat 2 || 6'),
        minPlayerForPlay: Joi.number().required().description('min player req Seat 2 '),
        currentRound: Joi.number().required().description('Current Rounds'),
        lobbyId: Joi.string().required().description('lobby id'),
        gameId: Joi.string().required().description('game id'),
        maximumPoints: Joi.number().required().description('max point for game'),
        winningScores: Joi.array()
            .items(Joi.number())
            .required()
            .description('Winning Score'),
        gameStartTimer: Joi.number().required().description('Game start Timer'),
        firstDrop: Joi.number().required().description('Game start Timer'),
        middleDrop: Joi.number().required().description('Game start Timer'),
        lastDrop: Joi.number().required().description('Game start Timer'),
        userTurnTimer: Joi.number().required().description('User Turn Timer'),
        secondaryTimer: Joi.number().required().description('User Secondry Turn Timer'),
        declareTimer: Joi.number().required().description('User Decalre Turn Timer'),
        splitTimer: Joi.number().required().description('User Split Turn Timer'),
        bootAmount: Joi.number().required().description('Boot Ammount Of Playing'),
        potValue: Joi.number().required().description('pot Value'),
        winPrice: Joi.number().required().description('win Price'),
        winner: Joi.array().required().description('winner array'),
        isFTUE: Joi.boolean().required().description('tutorial playing flag'),
        bot: Joi.boolean().required().description('user or bot'),
        mode: Joi.string().required().description('game mode'),
        rake: Joi.number().optional().description('rake Value'),
        createdAt: Joi.date().description("createAt"),
        updatedAt: Joi.date().description("update timer"),

        rummyType: Joi.string().allow("").description('rake Value'),
        moneyMode: Joi.string().allow("").description('rake Value'),
    })
    .unknown(true);

export = playingTableSchema;