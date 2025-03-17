import userValidator from "./helper/userValidator"
import playingTableValidator from "./helper/playingTableValidator"
import roundTableValidator from "./helper/roundTableValidator"
import playerGamePlayValidator from "./helper/playerGamePlayValidator"
import rejoinTableHistoryValidator from "./helper/rejoinTableHistoryValidator"
import setTableQueueValidator from "./helper/setTableQueueValidator"

const exportObject = {
    userValidator,
    playingTableValidator,
    roundTableValidator,
    playerGamePlayValidator,
    rejoinTableHistoryValidator,
    setTableQueueValidator,
}

export = exportObject;