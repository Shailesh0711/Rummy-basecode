import Joi from "joi"
import seatsSchema from "../methodSchemas/seatsSchema";


const formatGameTableInfoSchema = Joi.object().keys({
  isRejoin: Joi.boolean().required().description('Rehjoin Data'),
  bootAmount: Joi.number().required().description('boot value'),
  isFTUE: Joi.boolean().required().description('tutorial playing flag'),
  potValue: Joi.number().required().description('pot boot value'),
  winPrice: Joi.number().required().description('win price'),
  userTurnTimer: Joi.number().required().description('user Turn Timer'),
  winningScores: Joi.array()
    .items(Joi.number())
    .required()
    .description('winning Scores'),
  tableId: Joi.string().required().description('table Id'),
  roundTableId: Joi.string().required().description('round table Id'),
  totalPlayers: Joi.number().required().description('total Player'),
  totalRounds: Joi.number().required().description('total round'),
  maxPlayers: Joi.number().required().description('total max Player'),
  currentRound: Joi.number().required().description('currentRound'),
  seats: Joi.array().items(seatsSchema),

  opendDeck: Joi.array().items(Joi.string()).default([]),
  finishDeck: Joi.array().items(Joi.string()).default([]),
  trumpCard: Joi.array().items(Joi.string().allow("")).default([]),
  closedDeck: Joi.array().items(Joi.string()).default([]),

  dealerPlayer: Joi.number(),
  validDeclaredPlayerSI: Joi.number(),
  validDeclaredPlayer: Joi.string().allow(""),
  currentTurnSeatIndex: Joi.number(),
  currentTurn: Joi.string().allow(""),

  totalTurnTime: Joi.number(),
  timer: Joi.number(),

  isSeconderyTimer: Joi.boolean(),
  isRemainSeconderyTurns: Joi.boolean(),

  tableState: Joi.string(),
}).unknown(true);

export = formatGameTableInfoSchema;