// import DB from "../../../db"
import logger from "../../../../logger";
import { userIf, userSignUpIf } from "../../../interfaces/userSignUpIf"
import { getUser, setUser } from "../../cache/User";
import { defaultUserData } from "../../defaultGenerator";
import { EVENTS, MONGO, NUMERICAL } from "../../../../constants";
// import checkPlayingIcon from "../../utils/checkPlayingIcon";
import { getLock } from "../../../lock";
import { formatSignUpInfo } from "../../formatResponse";
import commonEventEmitter from "../../../commonEventEmitter";
import matchMaking from "../../matchMaking";
import { userProfileUpdate } from "./helper";
import { acquireNodeLock, releaseNodeLock } from "../../../common/localLock";


const setDataForUpdate = (
    signUpData: userIf,
    OldLobbyId: string,
    tableId: string,
    balance: number,
    oldTableId: string[],
): userIf => {
    logger.info("--------->> userSignUp :: setDataForUpdate <<---------- ")
    try {
        const currentTimestamp = new Date();
        const updateData: userIf = {
            _id: signUpData._id,
            userId: signUpData.userId,
            username: signUpData.username,
            socketId: signUpData.socketId,
            profilePicture: signUpData.profilePicture,
            lobbyId: signUpData.lobbyId.toString(),
            OldLobbyId: OldLobbyId,
            oldTableId: oldTableId,
            isFTUE: signUpData.isFTUE,
            gameId: signUpData.gameId,
            dealType: signUpData.dealType,
            gamePoolType: signUpData.gamePoolType,
            tableId: tableId,
            maximumSeat: signUpData.maximumSeat,
            fromBack: signUpData.fromBack,
            balance: balance,
            bootAmount: signUpData.bootAmount,
            isBot: signUpData.isBot,
            location: signUpData.location,
            authToken: signUpData.authToken,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp,
            minPlayer: signUpData.minPlayer,
            moneyMode: signUpData.moneyMode,
            rummyType: signUpData.rummyType,
            platformCommission: signUpData.platformCommission,
            isSplit: signUpData.isSplit
        };

        return updateData;
    } catch (error) {
        logger.error("---userSignUp :: setDataForUpdate ::", error);
        throw error;
    }
}

async function findOrCreateUser(signUpData: userIf): Promise<userIf> {
    try {
        logger.info("--------->> userSignUp :: findOrCreateUser <<---------- ")
        const { userId } = signUpData;

        let userInfo = await getUser(signUpData.userId);
        logger.info("--------->> userSignUp :: findOrCreateUser :: userInfo :: <<----------", userInfo)
        if (userInfo) {
            logger.info("------>> userSignUp :: old Socket Id :: ", userInfo.socketId);
            signUpData._id = userInfo._id;
            const OldLobbyId = userInfo.OldLobbyId as string;
            const oldTableId = userInfo.oldTableId as string[];
            const tableId = userInfo.tableId as string;
            logger.info('---->> findOrCreateUser : userInfo is avalible :: ', userInfo);
            const userProfileUpdateQuery: userIf = setDataForUpdate(signUpData, OldLobbyId, tableId, userInfo.balance, oldTableId);

            logger.info(
                '----->> findOrCreateUser : userProfileUpdateQuery ::',
                userProfileUpdateQuery,
            );
            await setUser(userId, userProfileUpdateQuery);
            userInfo = await getUser(userId);

        } else {
            logger.info('------>> findOrCreateUser : create data :: ');
            const userDefaultData: userIf = defaultUserData(signUpData);
            logger.info('------>> findOrCreateUser : userDefaultData :: ', userDefaultData);
            // add user info
            userDefaultData.balance = 50000;
            await setUser(userId, userDefaultData);
            userInfo = await getUser(userId);
            logger.info('------->> findOrCreateUser : Create USer :: ', userInfo);
        }

        return userInfo;
    } catch (error) {
        throw error;
    }
}


async function userSignUp(data: userSignUpIf, socket: any, ack?: Function): Promise<void> {

    logger.info("==============>> userSignUp <<=================", data.userId)
    let signUpLock = null;
    try {
        // signUpLock = await getLock().acquire([data.userId], 2000)
        signUpLock = await acquireNodeLock(data.userId);
        const signUpData: userIf = { ...data, socketId: socket.id }
        logger.info("------>> userSignUp :: new Socket Id :: ", socket.id)
        logger.info("------>> userSignUp :: signUpData :: ", signUpData)

        let userData: userIf = await findOrCreateUser(signUpData);
        logger.info("------>> userSignUp :: userData :: ", userData)

        await setUser(userData.userId, userData);

        // //update user profile details userId
        const userProfileDetail = await userProfileUpdate(userData, userData.socketId);
        userData = userProfileDetail;

        // const userGameData = await DB.mongoQuery.getOne(MONGO.USER, {
        //     csid: userData.userId,
        // });

        // if (!userGameData) {
        //     await DB.mongoQuery.add(MONGO.USER, {
        //         csid: signUpData.userId,
        //         username: signUpData.username,
        //         phoneNumber: '',
        //         profilePicture: signUpData.profilePicture,
        //         totalGamePlayed: NUMERICAL.ZERO,
        //         totalGameWinn: NUMERICAL.ZERO,
        //         totalGameLoss: NUMERICAL.ZERO,
        //     });
        // }
        // const { practiceMode } = await checkPlayingIcon();


        userData.fromBack = signUpData.fromBack;

        socket.eventMetaData = {
            userId: userData.userId,
            userObjectId: userData._id,
        };

        // const signUpDataFormated = await formatSignUpInfo(userData);
        // logger.info("------>> userSignUp :: signUpDataFormated :: ", signUpDataFormated)

        // commonEventEmitter.emit(EVENTS.SIGN_UP_SOCKET_EVENT, {
        //     socket,
        //     data: signUpDataFormated
        // })


        if (!userData.isBot) {
            // check re-join if player play in game
        }
        if (signUpLock) {
            logger.info("------>> userSignUp :: signUpLock :: release :: 1 ::")
            // await getLock().release(signUpLock);
            signUpLock = null;
        }
        await matchMaking({ lobbyId: userData.lobbyId }, socket, ack)

    } catch (error: any) {
        logger.error('CATCH_ERROR : userSignUp :: ', data, error);
        throw error;
    }finally{
        await releaseNodeLock(data.userId);
    }
}

export = userSignUp