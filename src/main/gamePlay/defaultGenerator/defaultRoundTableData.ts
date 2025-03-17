import { NULL, NUMERICAL, TABLE_STATE } from "../../../constants";
import { defaultRoundTableIf, roundTableIf, userSeatsIf } from "../../interfaces/roundTableIf";

const { ObjectID } = require("mongodb")

const createSeats = async (seat: number): Promise<userSeatsIf> => {
    let seats: userSeatsIf = {
        s0: {},
        s1: {},
    };
    if (seat === 6) {
        seats = {
            s0: {},
            s1: {},
            s2: {},
            s3: {},
            s4: {},
            s5: {},
        };
    }
    if (seat === 4) {
        seats = {
            s0: {},
            s1: {},
            s2: {},
            s3: {},
        };
    }

    return seats;
};

async function defaultRoundTableData(
    data: defaultRoundTableIf,
): Promise<roundTableIf> {
    const currentTimestamp = new Date();

    return {
        _id: ObjectID().toString(),
        tableId: data.tableId,
        tableState: TABLE_STATE.WAIT_FOR_PLAYER,
        trumpCard: NULL,
        closedDeck: [],
        opendDeck: [],
        finishDeck: [],
        nextRoundStartTimer: NUMERICAL.ZERO,
        totalPlayers: NUMERICAL.ZERO,         //manage lost player and leave table
        currentPlayer: NUMERICAL.ZERO,        // manage on dropRound and wrong Declare and leaveTable
        totalDealPlayer: NUMERICAL.ZERO,         // manage on split amount

        splitPlayers: NUMERICAL.ZERO,         // manage on split amount
        rummyType : data.rummyType,

        rejoinGamePlayer: NUMERICAL.ZERO,
        roundMaxPoint: NUMERICAL.ZERO,
        eliminatedPlayers: [],

        
        maxPlayers: data.totalPlayers,
        currentRound: NUMERICAL.ONE,
        dealType: data.dealType,
        validDeclaredPlayer: NULL,
        validDeclaredPlayerSI: NUMERICAL.MINUS_ONE,
        finishTimerStartPlayerId: NULL,
        firstTurn: false,
        currentTurn: NULL,
        nextTurn: NULL,
        totalPickCount: NUMERICAL.ZERO,
        dealerPlayer: NULL,
        tossWinnerPlayer: NULL,
        winnerPlayer: NULL,
        seats: await createSeats(data.totalPlayers),
        turnCount: NUMERICAL.ZERO,
        isSplit: false,
        isEligibleForSplit: false,
        isAutoSplit: false,
        isValidDeclared: false,
        isDropOrLeave: false,
        isPickUpFromOpenDeck: false,
        isSecondaryTurn: false,
        isCollectBootSend: false,
        isGameOver: false,

        isWaitingForRejoinPlayer: false,
        rejoinGamePlayersName: [],
        
        LPAS: NUMERICAL.ZERO,          // left player auto split
        history: [],
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp,
    };
}

export = defaultRoundTableData;