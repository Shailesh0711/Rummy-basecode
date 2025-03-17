import {
    allLobbyWiseOnlinePlayer,
    getPlayerOnlineCount,
    getPlayerOnlineCountLobbyWise,
    multipleLoginHandler,
    // getTableHistoryDetail,
    // getTrackingLobby,
    // playingTrackingFlage,
    userPlayingLobby
} from "../controllers";

const express = require("express");

const router = express.Router();

router.get("/test", (req: any, res: any) => {
    res.send("OK")
});

router.post("/userPlayingLobby", userPlayingLobby);
router.post('/getOnlinePlayerCount', getPlayerOnlineCount);
router.post('/getPlayerOnlineCountLobbyWise', getPlayerOnlineCountLobbyWise);
router.post("/allLobbyWiseOnlinePlayer", allLobbyWiseOnlinePlayer);

router.post("/multiLoginLogoutFromGameServer", multipleLoginHandler);

// router.post('/getTtackingLobby', getTrackingLobby);
// router.post('/playingTrackingFlage', playingTrackingFlage);
// router.post('/history', getTableHistoryDetail);

export default router