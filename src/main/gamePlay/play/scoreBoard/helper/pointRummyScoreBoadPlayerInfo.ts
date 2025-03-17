import { NUMERICAL, PLAYER_STATE, TABLE_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { cards } from "../../../../interfaces/cards";
import { roundTableIf } from "../../../../interfaces/roundTableIf";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getPlayerGamePlay } from "../../../cache/Players";
import { getTableData } from "../../../cache/Tables";
import checkCardSequence from "../../cards/checkCardSequence";

export async function pointRummyScoreBoadPlayerInfo(
    tableId: string,
    roundTableData: roundTableIf,
): Promise<UserInfoIf[]> {

    try {
        logger.info("--->> scoreBoadPlayerInfo :: tableId :: ", tableId)

        let playersInfo: UserInfoIf[] = [];
        const tableData = await getTableData(tableId);
        logger.info("--->> scoreBoadPlayerInfo :: tableData :: ", tableData);

        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ZERO) {
                if (roundTableData.seats[seat].inGame) {
                    let resCard: cards[] = [];
                    let eliminated: boolean = false;
                    const playerData = await getPlayerGamePlay(roundTableData.seats[seat].userId, tableId);
                    const state = roundTableData.seats[seat].userStatus;
                    if (
                        roundTableData.tableState !== TABLE_STATE.LOCK_IN_PERIOD &&
                        roundTableData.tableState !== TABLE_STATE.COLLECTING_BOOT_VALUE &&
                        roundTableData.tableState !== TABLE_STATE.TOSS_CARDS &&
                        state !== PLAYER_STATE.WATCHING
                    ) {
                        resCard = await checkCardSequence(playerData.currentCards, playerData, tableId)
                        logger.info("----->> scoreBoadPlayerInfo :: gamePoints ::", playerData.gamePoints)
                        logger.info("----->> scoreBoadPlayerInfo :: eliminated ::", eliminated)
                    }

                    const lossPoints = (playerData.playingStatus === PLAYER_STATE.WIN_ROUND || state === PLAYER_STATE.PLAYING) ?
                        NUMERICAL.ZERO : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                            playerData.dropCutPoint : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                80 : playerData.isDrop ?
                                    playerData.dropCutPoint : playerData.playingStatus === PLAYER_STATE.LEFT || state === PLAYER_STATE.LEFT || state === PLAYER_STATE.LOST ?
                                        80 : playerData.cardPoints === NUMERICAL.ZERO ?
                                            NUMERICAL.TWO : roundTableData.firstTurn && playerData.cardPoints > NUMERICAL.TWO ?
                                                playerData.cardPoints / NUMERICAL.TWO : playerData.cardPoints === NUMERICAL.ZERO ?
                                                    NUMERICAL.TWO : playerData.cardPoints;

                    const obj: UserInfoIf = {
                        userName: playerData.username,
                        userId: playerData.userId,
                        seatIndex: playerData.seatIndex,
                        profilePicture: playerData.profilePicture,
                        DealScore: (playerData.playingStatus === PLAYER_STATE.WIN_ROUND || state === PLAYER_STATE.PLAYING) ?
                            NUMERICAL.ZERO : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                                playerData.dropCutPoint : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                    80 : playerData.isDrop ?
                                        playerData.dropCutPoint : playerData.playingStatus === PLAYER_STATE.LEFT || state === PLAYER_STATE.LEFT || state === PLAYER_STATE.LOST ?
                                            80 : roundTableData.firstTurn && playerData.cardPoints > NUMERICAL.TWO ?
                                                playerData.cardPoints / NUMERICAL.TWO : playerData.cardPoints === NUMERICAL.ZERO ?
                                                    NUMERICAL.TWO : playerData.cardPoints,
                        gameScore: state === PLAYER_STATE.PLAYING ? "-" : NUMERICAL.ZERO === lossPoints ? `-` : `- ₹${Number(lossPoints) * tableData.bootAmount}`,
                        Status: state === PLAYER_STATE.WATCHING ?
                            PLAYER_STATE.WATCHING : (state === PLAYER_STATE.PLAYING) ?
                                PLAYER_STATE.DECLARING : playerData.isDrop ?
                                    PLAYER_STATE.DROP_TABLE_ROUND : state === PLAYER_STATE.LEFT ?
                                        PLAYER_STATE.LEFT : state === PLAYER_STATE.LOST ?
                                            PLAYER_STATE.LOST : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                                                PLAYER_STATE.DROP_TABLE_ROUND : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                                    PLAYER_STATE.WRONG_DECLARED : (state === PLAYER_STATE.WIN_ROUND) ?
                                                        PLAYER_STATE.WIN_ROUND : (state === PLAYER_STATE.DECLARED) ?
                                                            PLAYER_STATE.DECLARED : "LOST",
                        dealType: playerData.dealType,
                        cards: resCard,
                        message: (state === PLAYER_STATE.PLAYING) ?
                            `declaring` : (state === PLAYER_STATE.DROP_TABLE_ROUND) ?
                                `DROP` : state === PLAYER_STATE.LEFT ?
                                    "LEFT" : state === PLAYER_STATE.LOST ?
                                        `LOST` : (state === PLAYER_STATE.WRONG_DECLARED) ?
                                            `WRONG_SHOW` : (state === PLAYER_STATE.WIN_ROUND) ?
                                                `WIN` : (state === PLAYER_STATE.DECLARED) ?
                                                    `LOST` : "LOST",
                        socketId: playerData.socketId,
                        tableId: playerData.roundTableId,
                        isDeclared: state === PLAYER_STATE.PLAYING ? false : true,
                        isSwitchTable: playerData.isSwitchTable ? true : false,
                    };

                    playersInfo.push(obj)
                }
            }
        }
        logger.info("--->> scoreBoadPlayerInfo :: playersInfo :: ", playersInfo);
        return playersInfo;
    } catch (error) {
        logger.error("--scoreBoadPlayerInfo :: ERROR :: ", error);
        throw error;
    }
}
