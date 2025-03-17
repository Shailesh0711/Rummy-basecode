import { NUMERICAL } from "../../../constants";
import logger from "../../../logger";
import { userIf } from "../../interfaces/userSignUpIf";

export async function setOldTableIdsHistory(
    userData: userIf,
    tableId: string
) {
    try {
        const maxLimit = 20;
        const oldTableIdsClone: string[] = JSON.parse(JSON.stringify(userData.oldTableId));
        if (!Array.isArray(userData.oldTableId)) {
            userData.oldTableId = [];
        }

        let count: number = NUMERICAL.ZERO;
        for await (const oldTableId of userData.oldTableId) {
            if (oldTableId === tableId) {
                oldTableIdsClone.splice(count, NUMERICAL.ONE);
                count -= NUMERICAL.ONE;
            }
            count += NUMERICAL.ONE;
        }

        userData.oldTableId = oldTableIdsClone;
        userData.oldTableId.push(tableId);
        logger.info("----->> setOldTableIdsHistory :: oldTableId :: ", userData.oldTableId)
        const oldTableIdsCount = userData.oldTableId ? userData.oldTableId.length : NUMERICAL.ZERO;
        if (userData.oldTableId && oldTableIdsCount > maxLimit) {
            const lastRemoveIdIndex = oldTableIdsCount - maxLimit;
            userData.oldTableId.splice(NUMERICAL.ZERO, lastRemoveIdIndex);
        }

        return userData
    } catch (error) {
        logger.error(`--- setOldTableIdsHistory :: ERROR :: `, error);
        throw error;
    }
}