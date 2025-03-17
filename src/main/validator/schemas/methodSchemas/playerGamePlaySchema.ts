import Joi from 'joi';
import { SPLIT_STATE } from '../../../../constants';
import groupingCard from './groupingCardsSchema';

const playerGamePlaySchema = Joi.object()
  .keys({
    _id: Joi.string().required().description('user Unique Id'),
    userId: Joi.string().required().description('user Unique Id'),
    username: Joi.string().required().allow('').description('user name'),
    profilePicture: Joi.string()
      .required()
      .allow('')
      .description('User Profile Pic'),
    roundTableId: Joi.string().required().description('round id'),
    seatIndex: Joi.number().required().description('seat index'),
    dealType: Joi.number().required().description('rummy pool type'),
    poolType: Joi.number().required().description('rummy pool type'),
    userStatus: Joi.string().required().description('playing status'),
    playingStatus: Joi.string().required().description('playing status'),
    splitDetails: Joi.object().keys({
      splitStatus: Joi.string().valid(SPLIT_STATE.PENDING, SPLIT_STATE.YES, SPLIT_STATE.NO).required().description('split status'),
      amount: Joi.number().required().description('split amount'),
      drop: Joi.number().required().description('drop'),
    }).required().description('playing status'),
    isFirstTurn: Joi.boolean().required().description('first user turn'),
    socketId: Joi.string().required().description('User SocketId'),
    lastPickCard: Joi.string().allow("").description('user last pickup card'),
    lastDiscardcard: Joi.string().allow("").description('user last pickup card source'),
    lastCardPickUpScource: Joi.string().allow("").description('user All Card'),
    finishCard: Joi.string().allow("").description('user finish card'),
    currentCards: Joi.array().required().description('user All Card'),
    groupingCards: groupingCard,
    remainSecondryTime: Joi.number().required().description('user remain secondry timer'),
    remainDrop: Joi.number().required().description('user remain drops'),
    cardPoints: Joi.number().required().description('user cards point'),
    gamePoints: Joi.number().required().description('user total game points'),
    dropCutPoint: Joi.number().required().description('user total game points'),
    roundLostPoint: Joi.number().required().description('user total game points'),
    firstDropCutPoints: Joi.number().required().description('user total game points'),
    refrensDropsCountPoint: Joi.number().required().description('user total game points'),
    isBot: Joi.boolean().required().description('user is bot or not'),
    isLeft: Joi.boolean().required().description('user is left'),
    isAuto: Joi.boolean().required().description('auto turn'),
    isTurn: Joi.boolean().required().description('user turn'),
    isSplit: Joi.boolean().required().description('user is split'),
    isCardPickUp: Joi.boolean().required().description('user pick up card'),
    isDiscardcard: Joi.boolean().required().description('user discard Card'),
    isSecondaryTurn: Joi.boolean().required().description('isSecondaryTurn'),
    isWinner: Joi.boolean().required().description('isSecondaryTurn'),
    isDrop: Joi.boolean().required().description('isSecondaryTurn'),
    isDeclaringState: Joi.boolean().required().description('isSecondaryTurn'),
    winAmount: Joi.number().required().description('user current turn'),
    isDisconneted: Joi.boolean().required().description('isDisconneted'),
    isSwitchTable: Joi.boolean().required().description('isSwitchTable'),
    isWaitingForRejoinPlayer: Joi.boolean().required().description('isSwitchTable'),
    countTurns: Joi.number().required().description('user current turn'),
    remainMissingTurn: Joi.number().required().description('user remain missing turn'),
    createdAt: Joi.date().description("createAt"),
    updatedAt: Joi.date().description("update timer"),
  })
  .allow({})
  .unknown(true);

export = playerGamePlaySchema;