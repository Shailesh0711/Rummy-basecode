import Joi from "joi"
import seatsSchema from './seatsSchema';

const roundTableSchema = Joi.object()
    .keys({
        _id: Joi.string().required().description('Round Unique Id'),
        tableId: Joi.string().required().description('Table Unique Id'),
        tableState: Joi.string().required().description('Game Table Status'),
        trumpCard: Joi.string().allow("").description('trump Card'),
        closedDeck: Joi.array().description("close Deck"),
        opendDeck: Joi.array().description("open Deck"),
        finishDeck: Joi.array().description("finish Deck"),
        nextRoundStartTimer: Joi.number().required().description('next Round start Timer'),
        totalPlayers: Joi.number().required().description('Player Count'),
        currentPlayer: Joi.number().required().description('max players'),
        totalDealPlayer: Joi.number().required().description('total Players With GameStart'),
        splitPlayers: Joi.number().required().description('total Players With GameStart'),
        maxPlayers: Joi.number().required().description('Allow Player'),
        currentRound: Joi.number().required().description('Round Number'),
        dealType: Joi.number().required().description('Round Number'),
        rummyType: Joi.string().allow("").description("rummyType"),
        
        rejoinGamePlayer: Joi.number().required().description('Round Number'),
        roundMaxPoint: Joi.number().required().description('Round Number'),
        eliminatedPlayers: Joi.array().items(Joi.string()).default([]).required().description('Round Number'),

        validDeclaredPlayer: Joi.string().allow("").description("valid Declared Player"),
        validDeclaredPlayerSI: Joi.number().required().description('valid Declared Player SI'),
        finishTimerStartPlayerId: Joi.string().allow("").description("valid Declared Player"),
        firstTurn: Joi.boolean().description("start game then first turn true"),
        currentTurn: Joi.string().allow("").description('User Id'),
        nextTurn: Joi.string().allow("").description('User Id'),
        totalPickCount: Joi.number().required().description('Round Number'),
        dealerPlayer: Joi.string().allow("").description('Dealer User Id'),
        tossWinnerPlayer: Joi.string().allow("").description('toss Winner User Id'),
        winnerPlayer: Joi.string().allow("").description('winner User Id'),
        seats: seatsSchema,
        turnCount: Joi.number().required().description('Total Turn Count'),
        isSplit: Joi.boolean().default(false).description("user is splitting Amount"),
        isEligibleForSplit: Joi.boolean().default(false).description("user is splitting Amount"),
        isAutoSplit: Joi.boolean().default(false).description("user is splitting Amount"),
        isValidDeclared: Joi.boolean().default(false).description("valid Declare user"),
        isDropOrLeave: Joi.boolean().default(false).description("user drop or leave"),
        isPickUpFromOpenDeck: Joi.boolean().default(false).description("user PickUp From OpenDeck"),
        isSecondaryTurn: Joi.boolean().default(false).description("user PickUp From OpenDeck"),
        isCollectBootSend: Joi.boolean().default(false).description("user PickUp From OpenDeck"),
        isGameOver: Joi.boolean().default(false).description("user PickUp From OpenDeck"),
        
        isWaitingForRejoinPlayer: Joi.boolean().default(false).description("user PickUp From OpenDeck"),
        rejoinGamePlayersName: Joi.array().items(Joi.string()).default([]).required().description('Round Number'),

        LPAS: Joi.number().required().description('Total Turn Count'),
        history: Joi.array().description("history"),
        createdAt: Joi.date().description("createAt"),
        updatedAt: Joi.date().description("update timer")
    })
    .unknown(true);

export = roundTableSchema;