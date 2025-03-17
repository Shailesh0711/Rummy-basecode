import { NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { playerDetailsOfRoundHistoryIf, roundHistoryIf, tossHistoryIf } from "../../../interfaces/historyIf";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { getPlayerGamePlay } from "../../cache/Players";
import { getRoundTableHistory, setRoundTableHistory } from "../../cache/RoundHistory";


async function roundHistory(
    roundTableData: roundTableIf,
    currentRound: number,
    tossHistory?: tossHistoryIf
): Promise<void> {
    logger.info("------------------------------>> roundHistory <<-----------------------------------");
    try {
        const { tableId } = roundTableData;
        let RoundHistory: roundHistoryIf = await getRoundTableHistory(tableId);

        logger.info("------->> roundHistory :: RoundHistory :: ", RoundHistory);
        logger.info("------->> roundHistory :: currentRound :: ", currentRound);
        logger.info("------->> roundHistory :: tossHistory :: ", tossHistory ? tossHistory : "");

        if (!RoundHistory) {
            const players: playerDetailsOfRoundHistoryIf[] = []
            const userIds: string[] = []
            let dealType: number = 0;
            Object.keys(roundTableData.seats).map((seat) => {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    userIds.push(roundTableData.seats[seat].userId);
                }
            });

            for await (let userId of userIds) {
                const playerInfo = await getPlayerGamePlay(userId, tableId);
                logger.info("-------->> roundHistory :: playerInfo :: ", playerInfo)
                const obj: playerDetailsOfRoundHistoryIf = {
                    userId: playerInfo.userId,
                    userName: playerInfo.username,
                    seatIndex: playerInfo.seatIndex,
                    userStatus: playerInfo.userStatus,
                    playingStatus: playerInfo.playingStatus,
                    gameScore: playerInfo.gamePoints,
                    dealerScore: playerInfo.cardPoints,
                    socketId: playerInfo.socketId,
                }
                dealType = playerInfo.dealType
                players.push(obj)
            }

            RoundHistory = {
                [`Round${currentRound}`]: {
                    tableId: roundTableData.tableId,
                    trumpCard: roundTableData.trumpCard,
                    dealerPlayer: roundTableData.dealerPlayer,
                    roundWinner: roundTableData.winnerPlayer,
                    playersDetails: players,
                    currentRound: currentRound,
                    dealType: dealType,
                    tossHistory: tossHistory,
                }
            }
        }
        if (!RoundHistory[`Round${currentRound}`]) {
            const players: playerDetailsOfRoundHistoryIf[] = []
            const userIds: string[] = []
            let dealType: number = 0;
            Object.keys(roundTableData.seats).map((seat) => {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                    userIds.push(roundTableData.seats[seat].userId);
                }
            });

            for await (let userId of userIds) {
                const playerInfo = await getPlayerGamePlay(userId, tableId);
                logger.info("---------->> roundHistory :: playerInfo :: ", playerInfo)
                const obj: playerDetailsOfRoundHistoryIf = {
                    userId: playerInfo.userId,
                    userName: playerInfo.username,
                    seatIndex: playerInfo.seatIndex,
                    userStatus: playerInfo.userStatus,
                    playingStatus: playerInfo.playingStatus,
                    gameScore: playerInfo.gamePoints,
                    dealerScore: playerInfo.cardPoints,
                    socketId: playerInfo.socketId,
                }
                dealType = playerInfo.dealType
                players.push(obj)
            }
            RoundHistory[`Round${currentRound}`] = {
                tableId: roundTableData.tableId,
                trumpCard: roundTableData.trumpCard,
                dealerPlayer: roundTableData.dealerPlayer,
                roundWinner: roundTableData.winnerPlayer,
                playersDetails: players,
                currentRound: currentRound,
                dealType: dealType,
                tossHistory: tossHistory,
            }
        }

        if (RoundHistory[`Round${currentRound}`]) {
            const players: playerDetailsOfRoundHistoryIf[] = []
            const userIds: string[] = []
            Object.keys(roundTableData.seats).map((seat, index) => {
                if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                    for (let i = 0; i < RoundHistory[`Round${currentRound}`].playersDetails.length; i++) {
                        if (RoundHistory[`Round${currentRound}`].playersDetails[i].userId === roundTableData.seats[seat].userId) {
                            if (
                                RoundHistory[`Round${currentRound}`].playersDetails[i].userStatus === PLAYER_STATE.LEFT ||
                                RoundHistory[`Round${currentRound}`].playersDetails[i].userStatus === PLAYER_STATE.LOST
                            )
                                RoundHistory[`Round${currentRound}`].playersDetails[i].playingStatus = roundTableData.seats[seat].userStatus
                            RoundHistory[`Round${currentRound}`].playersDetails[i].userStatus = roundTableData.seats[seat].userStatus;
                        } else {
                            userIds.push(roundTableData.seats[seat].userId)
                        }
                    }
                }
            });


            for await (let userId of userIds) {
                const playerData = await getPlayerGamePlay(userId, tableId);
                for (let i = 0; i < RoundHistory[`Round${currentRound}`].playersDetails.length; i++) {
                    if (RoundHistory[`Round${currentRound}`].playersDetails[i].userId === userId) {
                        RoundHistory[`Round${currentRound}`].playersDetails[i].userStatus = playerData.userStatus
                        RoundHistory[`Round${currentRound}`].playersDetails[i].playingStatus = playerData.playingStatus
                        RoundHistory[`Round${currentRound}`].playersDetails[i].dealerScore = playerData.cardPoints
                        RoundHistory[`Round${currentRound}`].playersDetails[i].gameScore = playerData.gamePoints
                    }
                }
            }
        }


        RoundHistory[`Round${currentRound}`].roundWinner = roundTableData.validDeclaredPlayer;
        RoundHistory[`Round${currentRound}`].trumpCard = roundTableData.trumpCard;
        await setRoundTableHistory(roundTableData.tableId, RoundHistory);
        logger.info("------->> roundHistory :: setRoundTableHistory :: ", RoundHistory);

    } catch (error) {
        logger.error("---roundHistory :: ERROR :: ", error);
        throw error
    }
}

export = roundHistory;

