import { ERROR_TYPE, EVENTS, MESSAGES, NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import commonEventEmitter from "../../../../commonEventEmitter";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { getRoundTableData, setRoundTableData } from "../../../cache/Rounds";
import { formatReShuffleDeckInfo } from "../../../formatResponse";
import { shuffleCards } from "../../cards";
import Scheduler from "../../../../scheduler";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { leaveRoundTable } from "../../leaveTable/leaveRoundTable";
import { throwErrorIF } from "../../../../interfaces/throwError";
import checkCardSequence from "../../cards/checkCardSequence";
import countTotalPoints from "../../../utils/countTotalPoint";
import formatdiscardCardInfo from "../../../formatResponse/formatDiscardCardInfo";
import { playerPlayingDataIf } from "../../../../interfaces/playerPlayingTableIf";
import { getLock } from "../../../../lock";
import { getTableData } from "../../../cache/Tables";


export async function reShuffleCardCloseDeck(
    tableId: string,
    currentRound: number,
    currentTurnPlayerId: string,
    currentPlayerSeatIndex: number,
    roundTableInfo: roundTableIf
): Promise<void> {
    logger.info("------->> reShuffleCardCloseDeck <<-----------");
    try {
        roundTableInfo.turnCount -= NUMERICAL.ONE;
        logger.info("----->> reShuffleCardCloseDeck :: re_Shuffle cards :: <<---------")
        let openCardsDeck: string[] = JSON.parse(JSON.stringify((roundTableInfo.opendDeck)));

        const opendDeckLastCardIndex = openCardsDeck.length - NUMERICAL.ONE;
        const opendDeckLastCard = openCardsDeck[opendDeckLastCardIndex];

        roundTableInfo.opendDeck = []
        openCardsDeck.splice(opendDeckLastCardIndex, NUMERICAL.ONE);

        const closeCardsDeck = await shuffleCards(openCardsDeck);

        roundTableInfo.opendDeck.push(opendDeckLastCard)
        roundTableInfo.closedDeck = closeCardsDeck;
        await setRoundTableData(tableId, currentRound, roundTableInfo)
        logger.info("----->> reShuffleCardCloseDeck :: closedDeck :: ", closeCardsDeck)

        const formatedRes = await formatReShuffleDeckInfo(tableId, roundTableInfo.opendDeck)
        logger.info("----->> reShuffleCardCloseDeck :: formatReShuffleDeckInfo :: ", formatedRes)

        commonEventEmitter.emit(EVENTS.RE_SHUFFLE_CARD, {
            tableId,
            data: formatedRes
        });

        await Scheduler.addJob.ReShuffleCardQueue({
            tableId,
            timer: NUMERICAL.FOUR * NUMERICAL.THOUSAND,
            currentTurnPlayerId: currentTurnPlayerId,
            currentRound: currentRound,
            currentPlayerSeatIndex: currentPlayerSeatIndex
        })
    } catch (error) {
        logger.error("--- reShuffleCardCloseDeck :: ERROR: " + error)
        throw error;
    }
}

export async function cardNotPickUp(
    currentPlayerData: playerPlayingDataIf,
    tableId: string
): Promise<{
    currentPlayerData: playerPlayingDataIf;
    isLeft: boolean;
}> {
    try {
        logger.info("----->> cardNotPickUp :: card not pickup :: ")

        const tableData = await getTableData(tableId)
        logger.info("----->> cardNotPickUp :: tableData :: ", tableData);

        logger.info("----->> cardNotPickUp :: turn Over Player Data :: ", currentPlayerData)
        const remainMissingTurns = currentPlayerData.remainMissingTurn;

        let isLeft = false;
        logger.info("----->> cardNotPickUp  :: remainMissingTurns  :: 1 ::", remainMissingTurns)
        if (remainMissingTurns === NUMERICAL.ONE) {
            // leave Table logic here
            isLeft = true;
            currentPlayerData.remainMissingTurn -= NUMERICAL.ONE;
            await setPlayerGamePlay(currentPlayerData.userId, tableId, currentPlayerData);

            logger.info("----->> cardNotPickUp  :: remainMissingTurns :: 2 ::", remainMissingTurns)
            await leaveRoundTable(true, true, currentPlayerData.userId, tableId, tableData.currentRound);
        } else if (remainMissingTurns > NUMERICAL.MINUS_ONE) {
            currentPlayerData.remainMissingTurn -= NUMERICAL.ONE;
            await setPlayerGamePlay(currentPlayerData.userId, tableId, currentPlayerData);
        }
        logger.info("----->> cardNotPickUp :: card not pickup :: remainingTurns: ", currentPlayerData.remainMissingTurn);
        return { currentPlayerData, isLeft }

    } catch (error) {
        logger.error("--- cardNotPickUp :: ERROR: " + error)
        throw error;
    }
}

export async function cardNotDiscardCard(
    currentPlayerData: playerPlayingDataIf,
    roundTableInfo: roundTableIf,
    currentRound: number,
): Promise<{
    currentPlayerData: playerPlayingDataIf;
    roundTableInfo: roundTableIf;
}> {
    try {
        logger.info("----->> cardNotDiscardCard :: player card pickup but not discard card :: ")

        const { tableId } = roundTableInfo
        logger.info("----->> cardNotDiscardCard :: player card pickup but not discard card :: ")

        logger.info("----->> cardNotDiscardCard :: roundTableInfo :: ", roundTableInfo)
        logger.info("----->> cardNotDiscardCard :: turn Over Player Data :: ", currentPlayerData)

        const currentCards: string[][] = JSON.parse(JSON.stringify(currentPlayerData.currentCards));
        const lastPickCard = [currentPlayerData.lastPickCard]

        logger.info("----->> cardNotDiscardCard :: player card pickup but not discard card :: Auto Discard Card :: ", lastPickCard);

        let count = NUMERICAL.ZERO
        for await (const cards of currentCards) {
            let cardIndex = NUMERICAL.ZERO
            for await (const card of cards) {
                if (card === lastPickCard[NUMERICAL.ZERO]) {
                    currentCards[count].splice(cardIndex, NUMERICAL.ONE);
                    break;
                }
                cardIndex += NUMERICAL.ONE;
            }
            count += NUMERICAL.ONE;
        }

        roundTableInfo.opendDeck.push(lastPickCard[NUMERICAL.ZERO]);
        roundTableInfo.isSecondaryTurn = false;
        currentPlayerData.lastDiscardcard = lastPickCard[NUMERICAL.ZERO];
        currentPlayerData.isSecondaryTurn = false;
        currentPlayerData.isDiscardcard = true;
        currentPlayerData.currentCards = currentCards;
        await setRoundTableData(tableId, currentRound, roundTableInfo);

        const resCard = await checkCardSequence(currentCards, currentPlayerData, tableId)
        logger.info("----->> cardNotDiscardCard :: auto discardCard :: checkCardSequence :: ", checkCardSequence);

        const totalPoints = await countTotalPoints(resCard);
        logger.info("----->> cardNotDiscardCard :: auto discardCard :: totalPoints :: ", totalPoints);

        const formatedDiscardcards = await formatdiscardCardInfo(currentPlayerData.userId, tableId, currentPlayerData.seatIndex, totalPoints, resCard, lastPickCard, roundTableInfo.opendDeck);
        logger.info("----->> cardNotDiscardCard :: auto discardCard :: formatdiscardCardInfo :: ", formatdiscardCardInfo);

        commonEventEmitter.emit(EVENTS.DISCARD_CARD, {
            tableId,
            data: formatedDiscardcards
        });

        return {
            currentPlayerData,
            roundTableInfo
        }
    } catch (error) {
        logger.error("--- cardNotDiscardCard :: ERROR :: ", error);
        throw error;
    }
}