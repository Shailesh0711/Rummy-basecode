import { MONGO } from "../../../constants";
import logger from "../../../logger";
// import DB from "../../db"
import { lobbyIF } from "../../interfaces/lobby";

// async function checkPlayingIcon(): Promise<{ practiceMode: boolean }> {
//   try {
//     let practiceMode: boolean = false;
//     const query = {
//       mode: 'practice',
//       isActive: true,
//     };
//     const practice: lobbyIF = await DB.mongoQuery.getOne(MONGO.LOBBY, query);

//     if (practice) practiceMode = true;

//     return { practiceMode };
//   } catch (error) {
//     logger.error("--- checkPlayingIcon :: ERROR ::");
//     throw error;
//   }
// }

// export = checkPlayingIcon;