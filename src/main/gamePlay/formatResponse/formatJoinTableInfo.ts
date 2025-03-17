import { roundTableIf } from "../../interfaces/roundTableIf";
import Joi from "joi";
import Errors from "../../errors";
import { playarDetail } from "../../interfaces/responseIf";
import logger from "../../../logger";
import { responseValidator } from "../../validator";

// Formant Join Table Event Document
async function formatJoinTableInfo(
    seatIndex: number,
    roundTableData: roundTableIf,
):Promise<playarDetail> {
    try {
        let data: playarDetail = {
            _id: roundTableData.seats[`s${seatIndex}`]._id,
            userId: roundTableData.seats[`s${seatIndex}`].userId,
            username: roundTableData.seats[`s${seatIndex}`].username,
            profilePicture: roundTableData.seats[`s${seatIndex}`].profilePicture,
            seatIndex,
            userStatus: roundTableData.seats[`s${seatIndex}`].userStatus,
        };
        data = await responseValidator.formatJoinTableInfoValidator(data);
        return data;
    } catch (error) {
        logger.error(
            'CATCH_ERROR : formatJoinTableInfo :: ',
            seatIndex,
            roundTableData,
            error,
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatJoinTableInfo;