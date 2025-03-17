import { MESSAGES, NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { cards } from "../../../../interfaces/cards";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import checkCardSequence from "../../cards/checkCardSequence";


async function points(
    poolType: number,
    gamePoints: number
): Promise<boolean> {
    logger.info("------------------->> point <<--------------------")
    try {
        if (poolType <= gamePoints) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        logger.error("---points :: ERROR: " + error)
        throw error;
    }
}

async function poolRummyScoreBoadPlayerInfo(
    tableId: string,
    roundTableData: roundTableIf,
): Promise<UserInfoIf[]> {
    logger.info("--------->> poolRummyScoreBoadPlayerInfo <<----------")
    try {
        logger.info("--->> poolRummyScoreBoadPlayerInfo :: tableId :: ", tableId)

        let playersInfo: UserInfoIf[] = [];

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                if (roundTableData.seats[seat].inGame) {
                    let resCard: cards[] = []
                    let eliminated: boolean = false;
                    const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);
                    logger.info("----->> poolRummyScoreBoadPlayerInfo :: playerData ::", playerData);

                    const state = roundTableData.seats[seat].userStatus;
                    if (
                        roundTableData.tableState !== TABLE_STATE.LOCK_IN_PERIOD &&
                        roundTableData.tableState !== TABLE_STATE.COLLECTING_BOOT_VALUE &&
                        roundTableData.tableState !== TABLE_STATE.TOSS_CARDS
                    ) {
                        resCard = await checkCardSequence(playerData.currentCards, playerData, tableId)
                        eliminated = await points(playerData.poolType, playerData.gamePoints);
                        logger.info("----->> poolRummyScoreBoadPlayerInfo :: poolType ::", playerData.poolType)
                        logger.info("----->> poolRummyScoreBoadPlayerInfo :: gamePoints ::", playerData.gamePoints)
                        logger.info("----->> poolRummyScoreBoadPlayerInfo :: eliminated ::", eliminated)
                    }
                    const obj: UserInfoIf = {
                        userName: playerData.username,
                        userId: playerData.userId,
                        seatIndex: playerData.seatIndex,
                        profilePicture: playerData.profilePicture,
                        DealScore: (playerData.playingStatus === PLAYER_STATE.WIN_ROUND || state === PLAYER_STATE.PLAYING) ?
                            NUMERICAL.ZERO : (state === PLAYER_STATE.DROP_TABLE_ROUND || playerData.isDrop) ?
                                playerData.dropCutPoint : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                    ((playerData.poolType === NUMERICAL.SIXTY_ONE) ? NUMERICAL.SIXTY : 80) : playerData.cardPoints === NUMERICAL.ZERO ?
                                        NUMERICAL.TWO : playerData.playingStatus === PLAYER_STATE.LEFT ?
                                            80 : playerData.cardPoints,
                        gameScore: playerData.gamePoints,
                        Status: (state === PLAYER_STATE.PLAYING) ?
                            PLAYER_STATE.DECLARING : (state === PLAYER_STATE.DROP_TABLE_ROUND || playerData.isDrop) ?
                                PLAYER_STATE.DROP_TABLE_ROUND : state === PLAYER_STATE.LEFT ?
                                    PLAYER_STATE.LEFT : state === PLAYER_STATE.LOST ?
                                        PLAYER_STATE.LOST : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                            PLAYER_STATE.WRONG_DECLARED : (state === PLAYER_STATE.WIN_ROUND) ?
                                                PLAYER_STATE.WIN_ROUND : (state === PLAYER_STATE.DECLARED) ?
                                                    PLAYER_STATE.DECLARED : "LOST",
                        poolType: playerData.poolType,
                        cards: resCard,
                        message: (state === PLAYER_STATE.PLAYING) ?
                            `declaring` : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                                (eliminated ? MESSAGES.MESSAGE.Eliminated : `DROP`) : eliminated ?
                                    MESSAGES.MESSAGE.Eliminated : state === PLAYER_STATE.LEFT ?
                                        (eliminated ? MESSAGES.MESSAGE.Eliminated : `LEFT`) : state === PLAYER_STATE.LOST ?
                                            `LOST` : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                                (eliminated ? MESSAGES.MESSAGE.Eliminated : `WRONG_SHOW`) : (state === PLAYER_STATE.WIN_ROUND) ?
                                                    `WIN` : (state === PLAYER_STATE.DECLARED) ?
                                                        (eliminated ? MESSAGES.MESSAGE.Eliminated : `LOST`) : "LOST",
                        socketId: playerData.socketId,
                        tableId: playerData.roundTableId,
                        // isDeclared: (state === PLAYER_STATE.PLAYING || state === PLAYER_STATE.DROP_TABLE_ROUND) ? false : true,
                        isDeclared: state === PLAYER_STATE.PLAYING ? false : true,
                    };

                    playersInfo.push(obj)
                }
            }
        }
        logger.info("--->> poolRummyScoreBoadPlayerInfo :: playersInfo :: ", playersInfo);
        return playersInfo;
    } catch (error) {
        logger.error("--poolRummyScoreBoadPlayerInfo :: ERROR :: ", error);
        throw error;
    }
}

export = poolRummyScoreBoadPlayerInfo;