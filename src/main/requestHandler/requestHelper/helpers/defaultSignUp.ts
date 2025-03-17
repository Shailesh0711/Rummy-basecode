import { NUMERICAL, RUMMY_TYPES } from "../../../../constants";
import logger from "../../../../logger";
import { getRandomNumber } from "../../../common";
import { signUpRequestIf } from "../../../interfaces/requestIf";
import { userSignUpIf } from "../../../interfaces/userSignUpIf";



function defaultSignUpData(
    signUpData: signUpRequestIf,
    socket: any
): userSignUpIf {
    try {
        const data: userSignUpIf = {
            _id: "",
            userId: socket.userId,
            username: typeof signUpData.userName !== undefined ? signUpData.userName : "",
            profilePicture: signUpData.profilePic ? signUpData.profilePic : "",
            lobbyId: signUpData.lobbyId,
            isFTUE: signUpData.isFTUE
                ? signUpData.isFTUE
                : false,
            gameId: signUpData.gameId,
            dealType: signUpData.dealType !== "" ? Number(parseInt(signUpData.dealType)) : NUMERICAL.ZERO,
            gamePoolType: signUpData.gamePoolType !== "" ? Number(parseInt(signUpData.gamePoolType)) : NUMERICAL.ZERO,
            maximumSeat: Number(signUpData.noOfPlayer) ?
                Number(signUpData.noOfPlayer) : 2,
            minPlayer: Number(signUpData.minPlayer) ?
                Number(signUpData.minPlayer) : 2,
            fromBack: signUpData.fromBack ? signUpData.fromBack : false,
            // bootAmount: Number(signUpData.entryFee) ?
            //     Number(signUpData.entryFee) : 0,
            bootAmount: Number(signUpData.rummyType == RUMMY_TYPES.POINT_RUMMY) ? Number(signUpData.entryFee / NUMERICAL.EIGHTEEN) : Number(signUpData.entryFee),
            isBot: signUpData.isUseBot ?
                signUpData.isUseBot : false,
            location: {
                longitude: signUpData.longitude ? signUpData.longitude : "0",
                latitude: signUpData.latitude ? signUpData.latitude : "0"
            },
            authToken: socket.authToken,
            platformCommission: Number(signUpData.platformCommission) ? Number(signUpData.platformCommission) : 0,
            moneyMode: signUpData.moneyMode ? signUpData.moneyMode : "",
            rummyType: signUpData.rummyType ? signUpData.rummyType : "",
            balance: 0,

            isSplit: signUpData.isSplit ? signUpData.isSplit : false,
        }
        return data;
    } catch (error) {
        logger.error("---defaultSignUpData :: ERROR: ", error);
        throw error;
    }
}

export = defaultSignUpData;
