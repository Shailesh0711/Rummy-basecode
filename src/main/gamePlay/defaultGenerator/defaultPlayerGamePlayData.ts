import { NULL, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, SPLIT_STATE } from "../../../constants";
import { defaultPlayerTableIf, playerPlayingDataIf } from "../../interfaces/playerPlayingTableIf";
const { ObjectID } = require("mongodb")


const defaultPlayerGamePlayData = (
    data: defaultPlayerTableIf,
): playerPlayingDataIf => {
    const currentTimestamp = new Date();

    return {
        _id: ObjectID().toString(),
        userId: data.userId,
        username: data.username,
        profilePicture: data.profilePicture,
        roundTableId: data.roundTableId,
        seatIndex: data.seatIndex,
        dealType: data.rummyType === RUMMY_TYPES.DEALS_RUMMY ? data.dealType : NUMERICAL.ZERO,
        poolType: data.rummyType === RUMMY_TYPES.POOL_RUMMY ? data.gamePoolType : NUMERICAL.ZERO,
        userStatus: PLAYER_STATE.PLAYING,
        playingStatus: PLAYER_STATE.PLAYING,
        splitDetails: {
            splitStatus: SPLIT_STATE.PENDING,
            amount: NUMERICAL.ZERO,
            drop: NUMERICAL.ZERO
        },
        isFirstTurn: false,
        socketId: data.socketId,
        lastPickCard: NULL,
        lastDiscardcard: NULL,
        lastCardPickUpScource: NULL,
        finishCard: NULL,
        currentCards: [],
        groupingCards: {
            pure: [],
            impure: [],
            set: [],
            dwd: [],
            wildCards: [],
        },
        remainSecondryTime: NUMERICAL.THREE,
        remainDrop: NUMERICAL.THREE,
        cardPoints: NUMERICAL.ZERO,
        gamePoints: data.dealType === NUMERICAL.TWO ?
            160 : data.dealType === NUMERICAL.THREE ?
                240 : NUMERICAL.ZERO,
        dropCutPoint: NUMERICAL.ZERO,
        roundLostPoint: NUMERICAL.ZERO,
        firstDropCutPoints: (data.rummyType === RUMMY_TYPES.POOL_RUMMY && data.gamePoolType === 101) ?
            20 : (data.rummyType === RUMMY_TYPES.POOL_RUMMY && data.gamePoolType === 201) ?
                25 : 20,
        refrensDropsCountPoint: (data.gamePoolType === 101) ?
            100 : (data.gamePoolType === 201) ?
                200 : 0,
        isBot: data.isBot,
        isLeft: false,
        isAuto: false,
        isTurn: false,
        isSplit: false,
        isCardPickUp: false,
        isDiscardcard: false,
        isSecondaryTurn: false,
        isWinner: false,
        isDisconneted: false,
        isDrop: false,
        isDeclaringState: false,
        isSwitchTable : false,
        isWaitingForRejoinPlayer: false,
        winAmount: NUMERICAL.ZERO,
        countTurns: NUMERICAL.ZERO,
        remainMissingTurn: NUMERICAL.THREE,
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
    };
};

export = defaultPlayerGamePlayData;