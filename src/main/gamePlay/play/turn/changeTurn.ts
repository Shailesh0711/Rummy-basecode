import config = require("../../../../connections/config");
import { ERROR_TYPE, MESSAGES, NUMERICAL, PLAYER_STATE } from "../../../../constants";
import logger = require("../../../../logger");
import { userSeatsIf, userSeatKeyIf, userSeatKeyIF } from "../../../interfaces/roundTableIf";
import { throwErrorIF } from "../../../interfaces/throwError";
import { getRoundTableData } from "../../cache/Rounds";

async function changeturn(
    tableId: string,
    userId: string,
    currentRound: number,
): Promise<string> {
    logger.info("----->> changeturn <<-------")
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
        logger.info(`------>> changeturn :: roundTableData ::`, roundTableData)

        const userSeats: userSeatKeyIF[] = []
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > NUMERICAL.ONE) {
                if (roundTableData.seats[seat].userStatus === PLAYER_STATE.PLAYING) {
                    userSeats.push(roundTableData.seats[seat])
                } else if (roundTableData.seats[seat].userId === userId) {
                    if (
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.LEFT ||
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.DROP_TABLE_ROUND ||
                        roundTableData.seats[seat].userStatus === PLAYER_STATE.WRONG_DECLARED
                    ) {
                        userSeats.push(roundTableData.seats[seat])
                    }
                }
            }
        }

        userSeats.sort((a, b) => {
            return a.seatIndex - b.seatIndex
        });

        const userIds: string[] = [];

        userSeats.map((data) => {
            userIds.push(data.userId)
        });

        let currentTurnUserIndex: number = NUMERICAL.MINUS_ONE;
        let currentIndexCount: number = NUMERICAL.ZERO;
        for await (const userID of userIds) {
            if (userID === userId) {
                currentTurnUserIndex = currentIndexCount;
                break;
            }
            currentIndexCount += NUMERICAL.ONE;
        }
        logger.info("--- changeturn :: Current Turn User Index :: ", currentTurnUserIndex)

        if (IS_CLOCK_WISE) {

            let nextIndex = (currentTurnUserIndex + NUMERICAL.ZERO) % userIds.length;
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

            let userDetail = {} as userSeatKeyIF;
            for await (const ele of userSeats) {
                if (ele.userId === userIds[nextIndex]) {
                    userDetail = ele;
                    break;
                }
            }

            return userDetail.userId;
        }
    } catch (error) {
        logger.error("changeturn :: ERROR ::", error)
        throw error;
    }
}


export = changeturn;