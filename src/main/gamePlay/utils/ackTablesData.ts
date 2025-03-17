import { NUMERICAL, RUMMY_TYPES } from "../../../constants";
import logger from "../../../logger";
import { ackTableDataIF } from "../../interfaces/responseIf";
import { userSeatKeyIf } from "../../interfaces/roundTableIf";
import { userSeatsIf } from "../../interfaces/roundTableIf";
import { getRoundTableData } from "../cache/Rounds";
import { getTableData } from "../cache/Tables";


async function ackTablesData(
    tableIds: string[],
    userId: string
) {

    try {
        const tablesData: ackTableDataIF[] = [];
        for await (const tableId of tableIds) {
            const tableData = await getTableData(tableId);
            logger.info(`------>> ackTablesData :: tableData ::`, tableData)

            const roundTableData = await getRoundTableData(tableId, tableData.currentRound)
            logger.info(`------>> ackTablesData :: roundTableData ::`, roundTableData)

            let seatIndex = NUMERICAL.MINUS_ONE;
            let dealerPlayerIndex = NUMERICAL.MINUS_ONE;
            const playersDetails: userSeatKeyIf[] = [];
            let playerCount: number = NUMERICAL.ZERO;
            const seatIndexArray: number[] = [];

            for await (const seat of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                    if (roundTableData.seats[seat].userId === userId) {
                        seatIndex = roundTableData.seats[seat].seatIndex;
                    }
                    if (roundTableData.seats[seat].userId === roundTableData.dealerPlayer) {
                        dealerPlayerIndex = roundTableData.seats[seat].seatIndex
                    }

                    seatIndexArray.push(roundTableData.seats[seat].seatIndex)
                    playersDetails.push(roundTableData.seats[seat])
                    playerCount += NUMERICAL.ONE;
                }
            }

            logger.info(`------>> ackTablesData :: playerCount :: 1 ::`, playerCount);
            // playerCount = Math.max(...seatIndexArray) + NUMERICAL.ONE;
            // logger.info(`------>> ackTablesData :: playerCount :: 1 ::`, playerCount)

            const obj: ackTableDataIF = {
                tableId: tableId,
                seatIndex: seatIndex,
                gameType: tableData.rummyType,
                maximumSeat: tableData.maximumSeat,
                minimumSeat: tableData.minPlayerForPlay,
                activePlayers: roundTableData.totalPlayers,
                gameStartTimer: tableData.gameStartTimer,
                turnTimer: tableData.userTurnTimer,
                tableState: roundTableData.tableState,
                closedDeck: roundTableData.closedDeck,
                opendDeck: roundTableData.opendDeck,
                turnCount: roundTableData.turnCount,
                dealerPlayer: dealerPlayerIndex,
                declareingPlayer: '',
                validDeclaredPlayer: '',
                validDeclaredPlayerSI: NUMERICAL.MINUS_ONE,
                playersDetail: playersDetails,
                playersCount: tableData.rummyType !== RUMMY_TYPES.POINT_RUMMY && roundTableData.isCollectBootSend ?
                    playerCount : roundTableData.maxPlayers
            }

            tablesData.push(obj)
        }
        return tablesData;
    } catch (error) {
        logger.error("--- ackTablesData :: ERROR :: ", error);
        throw error;
    }
}

export = ackTablesData;