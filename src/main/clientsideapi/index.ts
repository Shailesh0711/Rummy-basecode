import { verifyUserProfile } from './verifyUserProfile';
import { getUserOwnProfile } from './getUserOwnProfile';
import { gameSettinghelp } from './gameSettingMenuHelp'
import { checkBalance } from "./checkBalance";
import { rediusCheck } from "./rediusCheck";
import { firstTimeIntrection } from "./firstTimeIntrection";
import { markCompletedGameStatus } from "./markCompletedGameStatus";
import { checkUserBlockStatus } from "./checkUserBlockStatus";
import { checkMaintanence } from "./checkMaintanence";
import { multiPlayerDeductEntryFee } from "./multiPlayerDeductEntryFee";
import { multiPlayerWinnScore } from './multiPlayerWinnScore';
// import { wallateDebit } from './walletDebit'
// import { getOneRobot } from "./getOneRobot";


let exportedObj = {
  verifyUserProfile,
  getUserOwnProfile,
  gameSettinghelp,
  checkBalance,
  rediusCheck,
  firstTimeIntrection,
  markCompletedGameStatus,
  checkUserBlockStatus,
  checkMaintanence,
  multiPlayerDeductEntryFee,
  multiPlayerWinnScore,
  // wallateDebit,
  // getOneRobot,
};

export = exportedObj;
