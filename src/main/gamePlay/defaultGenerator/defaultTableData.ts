import { GAME_TYPE, NUMERICAL } from "../../../constants";
import { playingTableIf } from "../../interfaces/playingTableIf";
import { userIf } from "../../interfaces/userSignUpIf";
const { ObjectID } = require("mongodb")


const defaultTableData = (
    data: userIf
): playingTableIf => {
    try {
        const currentTimestamp = new Date();
        return {
            _id: ObjectID().toString(),
            gameType: GAME_TYPE.SOLO,
            dealType: data.dealType,
            gamePoolType: data.gamePoolType,
            totalRounds: NUMERICAL.ONE,
            totalPlayers: NUMERICAL.ZERO,
            maximumSeat: Number(data.maximumSeat),
            minPlayerForPlay: Number(data.minPlayer),
            currentRound: NUMERICAL.ONE,
            lobbyId: data.lobbyId.toString(),
            gameId: data.gameId,
            maximumPoints: data.dealType !== NUMERICAL.ZERO ? (data.dealType === NUMERICAL.TWO ? 160 : data.dealType === NUMERICAL.THREE ? 240 : NUMERICAL.ZERO) : data.gamePoolType,
            winningScores: [NUMERICAL.ZERO],
            firstDrop: (data.gamePoolType === NUMERICAL.SIXTY_ONE) ?
                15 : (data.gamePoolType === NUMERICAL.ONE_HUNDRED_ONE) ?
                    20 : (data.gamePoolType === NUMERICAL.TWO_HUNDRED_ONE) ?
                        25 : 20,
            middleDrop: (data.gamePoolType === NUMERICAL.SIXTY_ONE) ?
                30 : (data.gamePoolType === NUMERICAL.ONE_HUNDRED_ONE) ?
                    40 : (data.gamePoolType === NUMERICAL.TWO_HUNDRED_ONE) ?
                        50 : 40,
            lastDrop: (data.gamePoolType === NUMERICAL.SIXTY_ONE) ?
                60 : (data.gamePoolType === NUMERICAL.ONE_HUNDRED_ONE) ?
                    80 : (data.gamePoolType === NUMERICAL.TWO_HUNDRED_ONE) ?
                        80 : 80,
            gameStartTimer: NUMERICAL.TEN,
            userTurnTimer: NUMERICAL.THIRTY,
            secondaryTimer: NUMERICAL.THIRTY,
            declareTimer: NUMERICAL.THIRTY,
            splitTimer: NUMERICAL.THIRTY,
            bootAmount: data.bootAmount,
            potValue: data.bootAmount,
            winPrice: NUMERICAL.ZERO,
            winner: [],
            isFTUE: data.isFTUE,
            rake: data.platformCommission ? data.platformCommission : NUMERICAL.ZERO,
            bot: data.isBot,
            mode: GAME_TYPE.PRACTICE,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
            startGameTime : new Date(),
            rummyType: data.rummyType,
            moneyMode: data.moneyMode,
            isAutoSplitEnabled: data.isSplit,
        };
    } catch (error) {
        throw error;
    }
};


export = defaultTableData