import redis from "../../../redis";
import { roundTableIf } from "../../../interfaces/roundTableIf";
import { PREFIX } from "../../../../constants/redis";
import logger from "../../../../logger";
import Errors from "../../../errors"
import { methodValidator } from "../../../validator";

const setRoundTableData = async (
    tableId: string,
    roundNo: number,
    data: roundTableIf,
) => {
    try {
        data = await methodValidator.roundTableValidator.roundTableValidator(data);
        const key = `${PREFIX.ROUND}:${tableId}:${roundNo}`;
        await redis.commands.setValueInKeyWithExpiry(key, data);


        return tableId;
    } catch (e) {
        logger.error(
            `CATCH_ERROR : setRoundTableData :: tableId: ${tableId} :: roundNo: ${roundNo}`,
            data,
            e,
        );
        throw new Errors.CancelBattle(e);
    }
};

const getRoundTableData = async (
    tableId: string,
    roundNo: number,
): Promise<roundTableIf> => {
    try {
        return redis.commands.getValueFromKey(
            `${PREFIX.ROUND}:${tableId}:${roundNo}`,
        );
    } catch (error) {
        logger.error(
            `CATCH_ERROR : getRoundTableData :: tableId: ${tableId} :: roundNo: ${roundNo}`,
            error,
        );
        throw new Errors.CancelBattle(error);
    }
};

const removeRoundTableData = async (tableId: string, roundNo: number): Promise<void> => {
    await redis.commands.deleteKey(`${PREFIX.ROUND}:${tableId}:${roundNo}`);
}


const exportObject = {
    setRoundTableData,
    getRoundTableData,
    removeRoundTableData
}

export = exportObject