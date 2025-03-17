import { NULL, NUMERICAL, PLAYER_STATE, SPLIT_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { getPlayerGamePlay, setPlayerGamePlay } from "../../../cache/Players";
import { getRoundTableData } from "../../../cache/Rounds";


async function filterPlayerForNextRound(
    userIDs: string[],
    tableId: string,
    currentRound: number
): Promise<void> {
    logger.info("-------->> filterPlayerForNextRound <<----------")
    try {

        const roundTableData = await getRoundTableData(tableId, currentRound)
        const userInfo = [];
        for (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                if (roundTableData.seats[seat].userStatus === PLAYER_STATE.WIN_ROUND) {
                    userInfo.push(roundTableData.seats[seat])
                }
            }
        }
        for await (let userID of userIDs) {
            const player = await getPlayerGamePlay(userID, tableId);

            player.remainDrop = player.remainDrop
            player.cardPoints = NUMERICAL.ZERO;
            player.userStatus = PLAYER_STATE.PLAYING;
            player.playingStatus = PLAYER_STATE.PLAYING;
            player.lastPickCard = NULL;
            player.finishCard = NULL;
            player.lastDiscardcard = NULL;
            player.lastCardPickUpScource = NULL;
            player.isFirstTurn = userInfo.length === NUMERICAL.ZERO ?
                true : userInfo && userInfo[NUMERICAL.ZERO] && 'userId' in userInfo[NUMERICAL.ZERO] && userInfo[NUMERICAL.ZERO].userId === userID ?
                    true : false;
            player.currentCards = [];
            player.groupingCards = {
                pure: [],
                impure: [],
                set: [],
                dwd: [],
                wildCards: []
            };
            player.currentCards = [];
            player.isTurn = false;
            player.isSecondaryTurn = false;
            player.isSplit = false;
            player.isCardPickUp = false;
            player.isDiscardcard = false;
            player.isDrop = false;
            player.isDeclaringState = false;
            player.isWaitingForRejoinPlayer = false;
            player.countTurns = NUMERICAL.ZERO;
            player.remainMissingTurn = NUMERICAL.THREE;
            player.roundLostPoint = NUMERICAL.ZERO;
            player.splitDetails = {
                amount: NUMERICAL.ZERO,
                drop: NUMERICAL.ZERO,
                splitStatus: SPLIT_STATE.PENDING
            }

            await setPlayerGamePlay(userID, tableId, player);
        }
        logger.info("---->> filterPlayerForNextRound :: player game play table updated ::")
    } catch (error) {
        logger.error("---filterPlayerForNextRound :: ERROR: " + error)
        throw error;
    }
}

export = filterPlayerForNextRound;