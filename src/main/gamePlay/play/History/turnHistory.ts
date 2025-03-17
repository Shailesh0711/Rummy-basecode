import logger from "../../../../logger";
import { turnHistoryIf, turnObjHistoryIf } from "../../../interfaces/historyIf";
import { playerPlayingDataIf } from "../../../interfaces/playerPlayingTableIf";
import { getTurnHistory, setTurnHistory } from "../../cache/TurnHistory";



async function turnHistory(
    tableId: string,
    turnCount: number,
    playerData: playerPlayingDataIf,
    currentRound: number,
): Promise<void> {
    logger.info("------------------>> turnHistory <<------------------------")
    try {
        let TurnHistory: turnHistoryIf = await getTurnHistory(tableId)
        if (!TurnHistory) {

            TurnHistory = {
                tableId: tableId,
                [`Round${currentRound}`]: []
            }
        }
        
        if (!TurnHistory[`Round${currentRound}`]) {
            TurnHistory[`Round${currentRound}`] = []
        }

        const obj: turnObjHistoryIf = {
            turnNo: turnCount,
            userId: playerData.userId,
            cardPoints: playerData.cardPoints,
            cardPicked: playerData.lastDiscardcard,
            cardPickUpSocure: playerData.lastCardPickUpScource,
            cardDiscarded: playerData.lastDiscardcard,
            finishCard: playerData.finishCard,
            cardState: playerData.groupingCards,
            createdAt: new Date(),
        }

        const roundhistory = TurnHistory[`Round${currentRound}`] as turnObjHistoryIf[]

        roundhistory.push(obj);

        await setTurnHistory(tableId, TurnHistory)

    } catch (error) {
        logger.error("---turnHistory :: ERROR :: " + error)
        throw error;
    }
}

export = turnHistory;