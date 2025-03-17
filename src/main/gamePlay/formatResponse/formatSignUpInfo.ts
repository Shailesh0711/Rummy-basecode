import { userIf } from "../../interfaces/userSignUpIf";
import Errors from "../../errors"
import logger from "../../../logger";
import { formatSingUpInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";


async function formatSignUpInfo(
    userData: userIf
): Promise<formatSingUpInfoIf> {
    try {
        let data:formatSingUpInfoIf = {
            _id: userData._id,
            userId: userData.userId,
            username: userData.username,
            socketId: userData.socketId,
            profilePicture: userData.profilePicture,
            lobbyId: userData.lobbyId.toString(),
            isFTUE: userData.isFTUE,
            dealType: userData.dealType,
            gameId: userData.gameId,
            tableId: userData.tableId,
            maximumSeat: userData.maximumSeat,
            fromBack: userData.fromBack,
            balance: userData.balance,
            bootAmount: userData.bootAmount,
            isBot: userData.isBot,
            location: userData.location,
            authToken: userData.authToken,
            minPlayer : userData.minPlayer,
            moneyMode : userData.moneyMode,
            rummyType : userData.rummyType,
        };
        return await responseValidator.formatSignUpInfoValidator(data);
    } catch (error) {
        logger.error('CATCH_ERROR : formatSingUpInfo :: ', userData, error);
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatSignUpInfo