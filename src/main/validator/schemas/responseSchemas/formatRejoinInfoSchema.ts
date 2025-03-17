import Joi from "joi"
import seatsSchema from "../methodSchemas/seatsSchema"
import formatFinishTimerStartSchema from "./formatFinishTimerStartSchema";
import cardsSchema from "./helper/cardsSchema"

const formatRejoinInfoSchema = Joi.object().keys({
    tableId: Joi.string().required(),
    // isLockInperiod: Joi.boolean().required().default(false),
    // isTurn: Joi.boolean().required().default(false),
    // isFinishTimerStart: Joi.boolean().required().default(false),
    isDeclareTimerStart: Joi.boolean().required().default(false),
    isScoreBoard: Joi.boolean().required().default(false),
    isSplit: Joi.boolean().required().default(false),
    isResultSplit: Joi.boolean().required().default(false),
    isShowPopup: Joi.boolean().required().default(false),
    timer: Joi.number().required(),
    isSecondaryTurn: Joi.boolean().required(),
    isSeconderyTurnsRemain: Joi.boolean().required(),
    userTotalTurnTimer: Joi.number().required(),
    message: Joi.string().allow("").required(),
    popupData: Joi.object().keys({
        msg: Joi.string().allow("").optional(),
        title : Joi.string().allow("").optional()
    }).default({}),
    balance: Joi.number().required(),
    bootAmount: Joi.number().required(),
    currentRound: Joi.number().required(),
    winPrice: Joi.number().required(),
    tableState: Joi.string().required(),
    totalPoints: Joi.number().required(),
    currentTurnUserId: Joi.string().allow("").required(),
    currentTurnSeatIndex: Joi.number().allow("").required(),
    dealerIndex: Joi.number().allow("").required(),
    chips: Joi.number().required(),
    selfPlayerDetails: Joi.object().keys({
        _id: Joi.string().allow("").required(),
        userId: Joi.string().allow("").required(),
        username: Joi.string().allow("").required(),
        profilePicture: Joi.string().allow("").required(),
        seatIndex: Joi.number().required(),
        userStatus: Joi.string().allow("").required(),
    }),
    trumpCard: Joi.array().items(Joi.string().allow("")).default([]),
    finishDeck: Joi.array().items(Joi.string().allow("")).default([]),
    playersDetails: Joi.array().items(seatsSchema).default([]),
    finishTimerStartPlayerDetail: Joi.object().keys({
        userId: Joi.string().required().optional().description("user Id"),
        seatIndex: Joi.number().required().optional().description("seat Index"),
    }).optional().default({}),
    otherPlayerDeclares: Joi.array().items(Joi.object().keys({
        userId: Joi.string().required().optional().description("user Id"),
        seatIndex: Joi.number().required().optional().description("seat Index"),
    }).optional()).default([]),
    splitDetails: Joi.array().items(Joi.object().keys({
        userId: Joi.string().required().optional().description("user Id"),
        amount: Joi.number().required().optional().description("amount"),
        splitStatus: Joi.string().required().optional().description("split Status"),
        remainDrops: Joi.number().required().optional().description("remain Drops"),
        socketId: Joi.string().required().optional().description("socketId"),
        userName: Joi.string().required().optional().description("userName"),
        gameScore: Joi.number().required().optional().description("game Score"),
    })).default([]),

    scoreBord: Joi.object().keys({
        tableId: Joi.string().optional().description("table Id"),
        timer: Joi.number().optional().description("cards"),
        message: Joi.string().optional().description("message"),
        trumpCard: Joi.array().items(Joi.string().optional().allow("")).description("trump Card"),
        isSplitAmount: Joi.boolean().optional().description("is Split Amount"),
        isLastDeal: Joi.boolean().optional().description("is Split Amount"),
        isLeaveBtn: Joi.boolean().default(false).description("is Split Amount"),
        scoreBoradTable: Joi.array().items(
            Joi.object().keys({
                userName: Joi.string().optional(),
                userId: Joi.string().optional(),
                seatIndex: Joi.number().optional(),
                profilePicture: Joi.string().optional(),
                DealScore: Joi.number().optional(),
                gameScore: Joi.string().allow("").optional(),
                Status: Joi.string().optional(),
                dealType: Joi.number().optional(),
                poolType: Joi.number().optional(),
                cards: Joi.array().items(cardsSchema).optional(),
                message: Joi.string().optional(),
                socketId: Joi.string().optional(),
                tableId: Joi.string().optional(),
                isDeclared: Joi.boolean().optional(),
            }).optional()
        ).default([]),
    }).optional().default({}).description("scoreBord"),

    cards: Joi.array().items(cardsSchema).default([]),
    opendDeck: Joi.array().items(Joi.string()).default([]),
    cardCounts : Joi.number().required(),
}).unknown(true)

export = formatRejoinInfoSchema;


