import { MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../../constants";
import logger from "../../../../../logger";
import { UserInfoIf } from "../../../../interfaces/scoreBoardIf";
import { getTableData } from "../../../cache/Tables";


export async function dealRummyCheckFinalWinerInScoreBoard(
    playersInfo: UserInfoIf[],
    currentRound: number
): Promise<{
    isDealOver: boolean;
    isFinalWinner: boolean;
    isMultiWinner: boolean;
    winnerPlayerData: UserInfoIf
    mulltiWinnerPlayerData: UserInfoIf[];
}> {
    try {

        logger.info(`--------------->> dealRummyCheckFinalWinerInScoreBoard <<--------------------------`);
        logger.info(`------>> dealRummyCheckFinalWinerInScoreBoard :: playersInfo :: `, playersInfo)

        let count: number = NUMERICAL.ZERO;
        let eliminatedPlayerCount: number = NUMERICAL.ZERO;
        let isFinalWinner: boolean = false;
        let isMultiWinner: boolean = false;
        let playerDetails: UserInfoIf[] = [];
        let winnerPlayerData = {} as UserInfoIf;

        let sameGameScore: number[] = []

        const tableData = await getTableData(playersInfo[NUMERICAL.ZERO].tableId);

        if (tableData.dealType === currentRound) {
            const playerGamePoints: number[] = [];
            for await (const player of playersInfo) {
                if (player.Status !== PLAYER_STATE.LEFT) {
                    const gameScore: number = Number(player.gameScore)
                    playerGamePoints.push(gameScore);
                }
            }

            logger.info("--------->> dealRummyCheckFinalWinerInScoreBoard :: playerGamePoints :: ", playerGamePoints)

            if (playersInfo.length === NUMERICAL.TWO) {
                const isAllScoreEqual = playerGamePoints.every((val) => val === playerGamePoints[NUMERICAL.ZERO]);

                if (isAllScoreEqual) {

                    for (const player of playersInfo) {
                        if (player.Status !== PLAYER_STATE.LEFT) {
                            playerDetails.push(player);
                        }
                    }

                    isMultiWinner = playerDetails.length > NUMERICAL.ONE ? true : false
                    winnerPlayerData = isMultiWinner ? winnerPlayerData : playerDetails[NUMERICAL.ZERO]
                    isFinalWinner = isMultiWinner ? false : true;
                    playerDetails = playerDetails;
                } else {
                    isFinalWinner = true;
                    const winnerPlayerScore = Math.max(...playerGamePoints);

                    for await (const winner of playersInfo) {
                        if (winner.gameScore == winnerPlayerScore && winner.Status !== PLAYER_STATE.LEFT) {
                            winnerPlayerData = winner;
                            break;
                        }
                    }

                }

                return {
                    isDealOver: true,
                    isFinalWinner: isFinalWinner,
                    isMultiWinner: isMultiWinner,
                    winnerPlayerData: winnerPlayerData,
                    mulltiWinnerPlayerData: playerDetails
                }


            } else if (playersInfo.length > NUMERICAL.TWO) {
                const sortPlayerScore = playerGamePoints.sort();
                logger.info(`------>> dealRummyCheckFinalWinerInScoreBoard :: playerGamePoints :: `, playerGamePoints)
                logger.info(`------>> dealRummyCheckFinalWinerInScoreBoard :: sortPlayerScore :: `, sortPlayerScore)
                let gameScoreCount = NUMERICAL.ZERO;

                for await (const gameScore of playerGamePoints) {
                    logger.info(`------>> dealRummyCheckFinalWinerInScoreBoard :: gameScoreCount :: `, gameScoreCount)

                    if (gameScore === playerGamePoints[gameScoreCount + NUMERICAL.ONE]) {
                        if (!sameGameScore.includes(gameScore)) {
                            sameGameScore.push(gameScore);
                        }
                    }
                    if ((gameScoreCount + NUMERICAL.ONE) === (playerGamePoints.length - NUMERICAL.ONE)) {
                        break;
                    }
                    gameScoreCount += NUMERICAL.ONE;
                }
                logger.info(`------>> dealRummyCheckFinalWinerInScoreBoard :: sameGameScore :: 1 ::`, sameGameScore)

                const winnerPlayerScore = Math.max(...playerGamePoints);
                logger.info(`------>> dealRummyCheckFinalWinerInScoreBoard :: winnerPlayerScore :: `, winnerPlayerScore)

                sameGameScore = sameGameScore.length > NUMERICAL.ZERO ? [Math.max(...sameGameScore)] : [];
                logger.info(`------>> dealRummyCheckFinalWinerInScoreBoard :: sameGameScore :: 1 ::`, sameGameScore)

                if (sameGameScore.length > NUMERICAL.ZERO && winnerPlayerScore === sameGameScore[NUMERICAL.ZERO]) {
                    for await (const player of playersInfo) {
                        if (sameGameScore[NUMERICAL.ZERO] == player.gameScore && player.Status !== PLAYER_STATE.LEFT) {
                            playerDetails.push(player);
                        }
                    }

                    isMultiWinner = playerDetails.length > NUMERICAL.ONE ? true : false
                    winnerPlayerData = isMultiWinner ? winnerPlayerData : playerDetails[NUMERICAL.ZERO]
                    isFinalWinner = isMultiWinner ? false : true;

                    return {
                        isDealOver: true,
                        isFinalWinner: isFinalWinner,
                        isMultiWinner: isMultiWinner,
                        winnerPlayerData: winnerPlayerData,
                        mulltiWinnerPlayerData: playerDetails
                    }
                } else {
                    isFinalWinner = true;

                    for await (const winner of playersInfo) {
                        if (winner.gameScore == winnerPlayerScore && winner.Status !== PLAYER_STATE.LEFT) {
                            winnerPlayerData = winner;
                            break;
                        }
                    }

                    return {
                        isDealOver: true,
                        isFinalWinner: true,
                        isMultiWinner: false,
                        winnerPlayerData: winnerPlayerData,
                        mulltiWinnerPlayerData: []
                    }
                }

            } else {
                return {
                    isDealOver: true,
                    isFinalWinner: false,
                    isMultiWinner: false,
                    winnerPlayerData: winnerPlayerData,
                    mulltiWinnerPlayerData: []
                }
            }

        } else {
            return {
                isDealOver: false,
                isFinalWinner: false,
                isMultiWinner: false,
                winnerPlayerData: winnerPlayerData,
                mulltiWinnerPlayerData: []
            }
        }
    } catch (error) {
        logger.error(`--- dealRummyCheckFinalWinerInScoreBoard :: ERROR :: `, error);
        throw error;
    }
}