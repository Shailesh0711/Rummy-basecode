import config from "../../../../connections/config";
import { ERROR_TYPE, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../constants";
import logger from "../../../../logger";
import { userSeatKeyIF } from "../../../interfaces/roundTableIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getRoundTableData } from "../../cache/Rounds";

async function selectDealer(
    tossWinerId: any,
    tableId: string,
    currentRound: number,
): Promise<string> {
    logger.info("---------->> selectDealer <<------------")
    const { IS_CLOCK_WISE } = config();
    try {

        const roundTableData = await getRoundTableData(tableId, currentRound);

        if (roundTableData === null) {
            const errorObj: throwErrorIF = {
                type: ERROR_TYPE.DECLARE_ERROR,
                message: MESSAGES.ERROR.ROUND_TABLE_NOT_FOUND_ERROR_MESSAGES,
                isCommonToastPopup: true,
            };
            throw errorObj;
        }
        logger.info(`------>> selectDealer :: roundTableData ::`, roundTableData)

        const userSeats: userSeatKeyIF[] = []
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                if (roundTableData.seats[seat].userStatus === PLAYER_STATE.PLAYING) {
                    userSeats.push(roundTableData.seats[seat])
                }
            }
        }

        userSeats.sort((a, b) => {
            return a.seatIndex - b.seatIndex
        });

        const userIds: string[] = [];

        for (const seat of userSeats) {
            userIds.push(seat.userId)
        }
        
        let currentTurnUserIndex: number = NUMERICAL.MINUS_ONE;
        let currentIndexCount: number = NUMERICAL.ZERO;
        for await (const userId of userIds) {
            if (userId === tossWinerId) {
                currentTurnUserIndex = currentIndexCount;
                break;
            }
            currentIndexCount += NUMERICAL.ONE;
        }
        logger.info("--- changeturn :: Current Turn User Index :: ", currentTurnUserIndex)

        if (!IS_CLOCK_WISE) {

            let nextIndex = (currentTurnUserIndex + NUMERICAL.ONE) % userIds.length;
            logger.info("--- changeturn :: nextIndex :: ", nextIndex);

            let userDetail = {} as userSeatKeyIF;
            for await (const ele of userSeats) {
                if (ele.userId === userIds[nextIndex]) {
                    userDetail = ele;
                    break;
                }
            }

            return userDetail.userId;
        } else {
            let nextIndex = (currentTurnUserIndex - NUMERICAL.ONE) % userIds.length;
            if (nextIndex === -NUMERICAL.ONE) {
                nextIndex = userIds.length - NUMERICAL.ONE
            }
            logger.info("--- changeturn :: nextIndex :: ", nextIndex);

            let userDetail = {} as userSeatKeyIF;
            for await (const ele of userSeats) {
                if (ele.userId === userIds[nextIndex]) {
                    userDetail = ele;
                }
            }

            return userDetail.userId;
        }

    } catch (error) {
        logger.error("selectDealer :: ERROR ::", error);
        throw error;
    }
}

export = selectDealer