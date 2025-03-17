import config from "../../connections/config";
import { EVENTS, MESSAGES, MONGO, NUMERICAL, REDIS } from "../../constants";
import logger from "../../logger";
import { getUser, setUser } from "../../main/gamePlay/cache/User";
import { getOnliPlayerCount, getOnliPlayerCountLobbyWise } from "../../main/gamePlay/cache/onlinePlayer";
import { resDataI } from "../../main/interfaces/controllersIf";
import commonEventEmitter from "../commonEventEmitter";
import { getPlayerGamePlay } from "../gamePlay/cache/Players";
import { getRoundTableData } from "../gamePlay/cache/Rounds";
import { getRejoinTableHistory } from "../gamePlay/cache/TableHistory";
import { getTableData } from "../gamePlay/cache/Tables";
import { leaveRoundTable } from "../gamePlay/play/leaveTable/leaveRoundTable";
// import { DB } from "../../main";
import { auth } from "./helper/auth";
const CryptoJS = require("crypto-js");
import Errors from "../errors"


export async function userPlayingLobby(req: any, res: any) {
    try {
        logger.info("----->> userPlayingLobby :: req.body ::", req.body);
        const { userId } = req.body;
        const userDetails = await getUser(userId);
        if (!userDetails) throw new Error(`get user profile failed`);
        logger.info("userDetails ", userDetails);

        let resData: resDataI = <resDataI>{};
        let isUserPlaying: boolean = false;
        if (userDetails && userDetails.lobbyId && userDetails.gameId) {
            isUserPlaying = true;
            resData.lobbyId = userDetails.lobbyId;
            resData.gameId = userDetails.gameId;
        } else {
            throw new Error("fetch User Playing Lobby Details failed");
        }
        logger.info("----->> userPlayingLobby :: resData ::", resData);

        const sendObject = {
            status: 200,
            success: true,
            message: "User Playing Lobby Details",
            data: {
                isUserPlaying,
                gameDetails: resData
            },
        }
        res.send(sendObject);

    } catch (error) {
        logger.error("CATCH_userPlayingLobby : ERROR ::", error);

        const sendObject = {
            status: 400,
            success: false,
            message: "fetch User Playing Lobby Details failed!",
            data: {
                isUserPlaying: false,
                gameDetails: null
            }
        }
        res.send(sendObject);
    }
}

export async function getPlayerOnlineCount(req: any, res: any) {
    try {
        logger.info('----->> getPlayerOnlineCount :: req.body :>> ', req.body);
        const onlinePlayerCount = await getOnliPlayerCount(REDIS.PREFIX.ONLINEPLAYER);
        logger.info("----->> getPlayerOnlineCount : onlinePlayerCount :: ", onlinePlayerCount);

        if (!onlinePlayerCount) {
            const sendObject = {
                status: 200,
                success: true,
                message: "Online Player",
                data: NUMERICAL.ZERO,
            }
            return res.send(sendObject);
        }

        const sendObject = {
            status: 200,
            success: true,
            message: "Online Player",
            data: onlinePlayerCount,
        }
        return res.send(sendObject);
    } catch (error) {
        logger.error("CATCH_GETONLINEPLAYERCOUNT ::", error)
    }
}


export async function allLobbyWiseOnlinePlayer(req: any, res: any) {
    try {
        logger.info('allLobbyWiseOnlinePlayer :: req.body  :::', req.body);
        let query = {
            lobbyIds: req.body.lobbyIds
        }

        const lobbyIds = query.lobbyIds;
        logger.info('allLobbyWiseOnlinePlayer :: lobbyIds  :::', lobbyIds);

        if (!lobbyIds) {
            const resObject = {
                status: 200,
                success: false,
                message: "oops! Something want wrong",
                data: null
            }
            return res.send(resObject)
        }

        let onlinePlayers: any[] = []

        for (let index = 0; index < lobbyIds.length; index++) {
            const element = lobbyIds[index];

            const getOnlinePlaer = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, element);
            logger.info('allLobbyWiseOnlinePlayer :: getOnlinePlaer  :::', getOnlinePlaer);
            // const abc = NUMERICAL.TEN
            const data = {
                lobbyId: element,
                lobbyWiseOnlinePlayer: getOnlinePlaer == null ? NUMERICAL.ZERO : getOnlinePlaer
            }
            onlinePlayers.push(data)
        }

        logger.info('allLobbyWiseOnlinePlayer :: onlinePlayers  :::', onlinePlayers);
        const resObject = {
            status: 200,
            success: true,
            message: "online players",
            data: onlinePlayers
        }
        return res.send(resObject)

    } catch (error) {
        logger.error('allLobbyWiseOnlinePlayer :>> ', error);
        const resObject = {
            status: 400,
            success: false,
            message: "oops! Something want wrong",
            data: null
        }
        return res.send(resObject)
    }
}

export async function getPlayerOnlineCountLobbyWise(req: any, res: any) {
    try {
        logger.info("getPlayerOnlineCountLobbyWise :: req.body   :: >>>", req.body);
        const query = {
            lobbyId: req.body.lobbyId
        }

        if (!query.lobbyId) {
            const resObject = {
                status: 400,
                success: false,
                message: "oops! Something want wrong",
                data: null
            }
            return res.send(resObject)
        }

        const onlinePlayerCountLobbyWise = await getOnliPlayerCountLobbyWise(REDIS.PREFIX.ONLINE_PLAYER_LOBBY, query.lobbyId);
        logger.info("getPlayerOnlineCountLobbyWise : onlinePlayerCount :: ", onlinePlayerCountLobbyWise)

        if (!onlinePlayerCountLobbyWise) {
            const sendObject = {
                status: 200,
                success: true,
                message: "Online Player lobbyId",
                data: NUMERICAL.ZERO,
            }
            return res.send(sendObject);
        }

        const sendObject = {
            status: 200,
            success: true,
            message: "Player Online in lobby ",
            data: onlinePlayerCountLobbyWise == null ? NUMERICAL.ZERO : onlinePlayerCountLobbyWise,
        }

        return res.send(sendObject);
    } catch (error) {
        logger.error("CATCH_ERROR :: ", error);
        const resObject = {
            status: 400,
            success: false,
            message: "oops! Something want wrong",
            data: null
        }
        return res.send(resObject)

    }
}


export async function multipleLoginHandler(req: any, res: any) {
    const { SECRET_KEY } = config();
    try {
        logger.info('multipleLoginHandler :: req.body  :::', req.body);


        const authKey = req.headers["authorization"];
        logger.info("multipleLoginHandler :: authKey  :::", authKey);
        let userId = CryptoJS.AES.decrypt(authKey, SECRET_KEY).toString(CryptoJS.enc.Utf8);
        logger.info("multipleLoginHandler :: userId :::", userId);


        if (!userId) {
            const resObj = {
                status: 400,
                success: true,
                message: "oops ! Something want wrong",
                data: null
            }
            return res.send(resObj);
        }

        const userProfile = await getUser(userId);
        if (!userProfile) throw new Errors.UnknownError('Unable to get user Profile ');
        if (req.body && req.body.token) {
            userProfile.authToken = req.body.token;
            await setUser(userId, userProfile);
        }


        const lobbyId = userProfile.OldLobbyId as string;
        const rejoinUserHistory = await getRejoinTableHistory(userId, userProfile.gameId, lobbyId);
        logger.info("----->> multipleLoginHandler :: rejoinUserHistory ::", rejoinUserHistory);


        if (userProfile && rejoinUserHistory) {
            const tableConfig = await getTableData(rejoinUserHistory.tableId)

            logger.info("----->> multipleLoginHandler :: tableConfig ::", tableConfig);
            const tableGamePlay = await getRoundTableData(rejoinUserHistory.tableId, tableConfig.currentRound);
            logger.info("----->> multipleLoginHandler :: tableGamePlay ::", tableGamePlay);
            const playerGamePlay = await getPlayerGamePlay(userId, rejoinUserHistory.tableId)
            logger.info("----->> multipleLoginHandler :: playerGamePlay ::", playerGamePlay);

            // if (!tableGamePlay) throw new Errors.UnknownError('Unable to get table game play');
            // if (!playerGamePlay) throw new Errors.UnknownError('Unable to get player game play');
            // if (!tableConfig) throw new Errors.UnknownError('Unable to get player game play');


            if (
                tableConfig && tableGamePlay && playerGamePlay
            ) {
                await leaveRoundTable(true, true, userId, rejoinUserHistory.tableId, tableConfig.currentRound, true)
            } else {
                let msg = MESSAGES.ERROR.MULTIPLE_LOGIN_FAILED_MSG;
                let nonProdMsg = "";
                let errorCode = 500;
                nonProdMsg = "FAILED";


                commonEventEmitter.emit(EVENTS.SHOW_POP_SOCKET_EVENT, {
                    socket: userProfile.socketId,
                    data: {
                        isPopup: true,
                        popupType: MESSAGES.ALERT_MESSAGE.TYPE.COMMON_POPUP,
                        title: nonProdMsg,
                        message: msg,
                        tableId: userProfile.tableId,
                        buttonCounts: NUMERICAL.ONE,
                        button_text: [MESSAGES.ALERT_MESSAGE.BUTTON_TEXT.EXIT],
                        button_color: [MESSAGES.ALERT_MESSAGE.BUTTON_COLOR.RED],
                        button_methods: [MESSAGES.ALERT_MESSAGE.BUTTON_METHOD.EXIT],
                    },
                });
            }
            const resObj = {
                status: 200,
                success: true,
                message: "sucessfully",
                data: null
            }
            return res.send(resObj);
        }
        else {
            throw new Errors.UnknownError('Unable user in table seats');
        }


    } catch (error) {
        logger.error('multipleLoginHandler :>> ', error);
        const resObj = {
            status: 400,
            message: "oops ! Something want wrong",
            data: null
        }
        return res.send(resObj);
    }
}
