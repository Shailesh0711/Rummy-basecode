import { NULL, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { userSeatsIf } from "../../../../interfaces/roundTableIf";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";


async function filterRoundTableForNextRound(
    tableId: string,
    currentRound: number,
    nextRound: number
): Promise<void> {
    logger.info("------->> filterRoundTableForNextRound <<-----------")
    try {
        const roundTableData = await getRoundTableData(tableId, currentRound);
        logger.info("---->> filterRoundTableForNextRound :: roundTableData :: ", roundTableData)

        const seats = roundTableData.seats;
        let count = 0;
        const remainPlayerSeats: userSeatsIf = {} as userSeatsIf;
        for await (const seat of Object.keys(seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                if (
                    seats[seat].userStatus === PLAYER_STATE.PLAYING ||
                    seats[seat].userStatus === PLAYER_STATE.DROP_TABLE_ROUND ||
                    seats[seat].userStatus === PLAYER_STATE.WIN_ROUND ||
                    seats[seat].userStatus === PLAYER_STATE.WRONG_DECLARED ||
                    seats[seat].userStatus === PLAYER_STATE.DECLARED
                ) {
                    count += 1;
                    seats[seat].userStatus = PLAYER_STATE.PLAYING;
                    remainPlayerSeats[seat] = seats[seat];
                } else if (
                    seats[seat].userStatus === PLAYER_STATE.LEFT ||
                    seats[seat].userStatus === PLAYER_STATE.LOST
                ) {
                    remainPlayerSeats[seat] = seats[seat];
                    remainPlayerSeats[seat].inGame = false;
                    // await removePlayerGameData(seats[seat].userId, tableId)
                }
            }
        }

        roundTableData.turnCount = NUMERICAL.ZERO;
        roundTableData.currentRound += NUMERICAL.ONE;
        roundTableData.finishTimerStartPlayerId = NULL;
        roundTableData.tossWinnerPlayer = roundTableData.validDeclaredPlayer;
        roundTableData.seats = remainPlayerSeats;
        roundTableData.isValidDeclared = false;
        roundTableData.currentPlayer = count;
        roundTableData.totalPlayers = count;
        roundTableData.tableState = TABLE_STATE.NEXT_ROUND_START;
        roundTableData.trumpCard = NULL;
        roundTableData.closedDeck = []
        roundTableData.opendDeck = []
        roundTableData.finishDeck = []
        roundTableData.validDeclaredPlayer = NULL
        roundTableData.validDeclaredPlayerSI = NUMERICAL.MINUS_ONE
        roundTableData.firstTurn = true;
        roundTableData.isPickUpFromOpenDeck = false;
        roundTableData.isSplit = false;
        roundTableData.isEligibleForSplit = false;
        roundTableData.isSecondaryTurn = false;
        roundTableData.isAutoSplit = false;

        roundTableData.isWaitingForRejoinPlayer = false;
        roundTableData.eliminatedPlayers = [];
        roundTableData.roundMaxPoint = NUMERICAL.ZERO;
        roundTableData.rejoinGamePlayersName = []

        roundTableData.currentTurn = NULL;
        roundTableData.updatedAt = new Date();
        await setRoundTableData(tableId, nextRound, roundTableData);

        logger.info(`---->> filterRoundTableForNextRound :: create a new round table and new round is ${nextRound} :: `)

    } catch (error) {
        logger.error("---filterPlayersForNextRound :: ERROR ::", error);
    }
}

export = filterRoundTableForNextRound;