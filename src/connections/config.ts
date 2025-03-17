import { NUMERICAL } from "../constants";
import dotenv from "dotenv";
import path from "path";

// dotenv.config({path: path.join(__dirname, "../../.env")});1
dotenv.config();

const processEnv = process.env;
let configData: any = null;

function getEnvJSON(env: any) {
  const KEY_FILE = `SSL_KEY_FILE`;
  const CRT_FILE = `SSL_CRT_FILE`;

  const isClockWise = `IS_CLOCK_WISE`;

  const NODE_ENV = `NODE_ENV`;
  const serverType = `${env}_SERVER_TYPE`;
  const serverPort = `${env}_HTTP_SERVER_PORT`;

  const redisUrl = `REDIS_CONNECTION_URL`;

  const redisHost = `${env}_REDIS_HOST`;
  const redisPassword = `${env}_REDIS_PASSWORD`;
  const redisPort = `${env}_REDIS_PORT`;
  const redisDB = `${env}_REDIS_DB`;
  const REDIS_KEY = `REDIS_KEY`;
  const REDIS_CRT = `REDIS_CRT`;
  const REDIS_CA = `REDIS_CA`;

  const pubSubRedisHost = `${env}_PUBSUB_REDIS_HOST`;
  const pubSubRedisPassword = `${env}_PUBSUB_REDIS_PASSWORD`;
  const pubSubRedisPort = `${env}_PUBSUB_REDIS_PORT`;
  const pubSubRedisDb = `${env}_PUBSUB_REDIS_DB`;

  const dbProto = `${env}_DB_PROTO`;
  const dbHost = `${env}_DB_HOST`;
  const dbPort = `${env}_DB_PORT`;
  const dbUsername = `${env}_DB_USERNAME`;
  const dbPassword = `${env}_DB_PASSWORD`;
  const dbName = `${env}_DB_NAME`;

  const rejoinEndMessage = `REJOIN_END_GAME_REASON`;
  const beforeGameStartLeaveReason = `BEFORE_GAME_START_LEAVE_REASON`;
  const ftueDisconnectPopReason = `FTUE_DISCONNECT_POP_REASON`;
  const timeOutCounter = `Time_Out_Count`;

  const lockInPeriod = `LOCK_IN_PERIOD`;

  const gameStartTimer = `GAME_START_TIMER`;
  const waitingForPlayer = `WAITING_FOR_PLAYER`;
  const bootColletionTimer = `BOOT_COLLECTION_TIMER`;
  const tossCardTimer = `TOSS_CARD_TIMER`;
  const distributeCards = `DISTRIBUTE_CARDS`;
  const turnTimer = `TURN_TIMER`;
  const startFinishTimer = `START_FINISH_TIMER`;
  const notYoursTurnTimer = `NOT_YOUR_TURN_POPUP_MESSAGE`;
  const scoreBoardTimer = `SCORE_BOARD_TIMER`;
  const leaveTableTimer = `LEAVE_TABLE_TIMER`;
  const lockInperiodTimer = `LOCK_IN_PERIOD_TIMER`;
  const autoScoreBoardTimer = `AUTO_SCORE_BOARD_TIMER`;
  const remainPlayersFinishTimer = `REMAIN_PLAYERS_FINISH_TIMER`;
  const splitAmountTimer = `SPLIT_AMOUNT_TIMER`;
  const nextRoundTimer = `NEXT_ROUND_TIMER`;
  const autoSplitTimer = `AUTO_SPLIT_AMOUNT_TIMER`;
  const secondaryTimer = `SECONDARY_TIMER`;
  const rejoinGamePopupTimer = `REJOINT_GAME_POPUP_TIMER`;

  const APP_KEY = `APP_KEY`;
  const APP_DATA = `APP_DATA`;
  const seceretKey = `SECRET_KEY`;

  const API_BASE_URL = `API_BASE_URL`;
  const GAME_ID = `GAME_ID`;

  return Object.freeze({
    CRT_FILE: String(processEnv[CRT_FILE]),
    KEY_FILE: String(processEnv[KEY_FILE]),

    // IS_CLOCK_WISE: processEnv[isClockWise],
    IS_CLOCK_WISE: false,

    NODE_ENV: processEnv[NODE_ENV],
    SERVER_TYPE: processEnv[serverType],
    HTTP_SERVER_PORT: processEnv[serverPort],

    REDIS_CONNECTION_URL: processEnv[redisUrl],

    REDIS_HOST: processEnv[redisHost],
    REDIS_PASSWORD: processEnv[redisPassword],
    REDIS_PORT: processEnv[redisPort],
    REDIS_DB: processEnv[redisDB],
    REDIS_KEY: processEnv[REDIS_KEY],
    REDIS_CRT: processEnv[REDIS_CRT],
    REDIS_CA: processEnv[REDIS_CA],

    PUBSUB_REDIS_HOST: processEnv[pubSubRedisHost],
    PUBSUB_REDIS_PASSWORD: processEnv[pubSubRedisPassword],
    PUBSUB_REDIS_PORT: processEnv[pubSubRedisPort],
    PUBSUB_REDIS_DB: processEnv[pubSubRedisDb],

    DB_PROTO: processEnv[dbProto],
    DB_HOST: processEnv[dbHost],
    DB_PORT: processEnv[dbPort],
    DB_USERNAME: processEnv[dbUsername],
    DB_PASSWORD: processEnv[dbPassword],
    DB_NAME: processEnv[dbName],

    REJOIN_END_GAME_REASON: processEnv[rejoinEndMessage],
    BEFORE_GAME_START_LEAVE_REASON: processEnv[beforeGameStartLeaveReason],
    FTUE_DISCONNECT_POP_REASON: processEnv[ftueDisconnectPopReason],
    TIME_OUT_COUNT: Number(processEnv[timeOutCounter]),

    TOTAL_GAME_START_TIMER: Number(processEnv[gameStartTimer]),
    GAME_START_TIMER:
      Number(processEnv[gameStartTimer]) -
      Number(processEnv[lockInperiodTimer]),
    WAITING_FOR_PLAYER: processEnv[waitingForPlayer],
    BOOT_COLLECTION_TIMER: processEnv[bootColletionTimer],
    TOSS_CARD_TIMER: processEnv[tossCardTimer],
    DISTRIBUTE_CARDS: processEnv[distributeCards],
    TURN_TIMER: processEnv[turnTimer],
    START_FINISH_TIMER: processEnv[startFinishTimer],
    SCORE_BOARD_TIMER: processEnv[scoreBoardTimer],
    POINT_RUMMY_SCORE_BOARD_TIMER: NUMERICAL.ELEVEN,
    LEAVE_TABLE_TIMER: processEnv[leaveTableTimer],
    LOCK_IN_PERIOD_TIMER: processEnv[lockInperiodTimer],
    REMAIN_PLAYERS_FINISH_TIMER: processEnv[remainPlayersFinishTimer],
    AUTO_SCORE_BOARD_TIMER: processEnv[autoScoreBoardTimer],
    SPLIT_AMOUNT_TIMER: processEnv[splitAmountTimer],
    NEXT_ROUND_TIMER: processEnv[nextRoundTimer],
    AUTO_SPLIT_AMOUNT_TIMER: processEnv[autoSplitTimer],
    SECONDARY_TIMER: NUMERICAL.FIFTEEN,
    NEW_GAME_START_TIMER: NUMERICAL.FIVE,
    DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER: NUMERICAL.FIVE,
    DEAL_NEW_GAME_TIMER: NUMERICAL.TEN,

    REJOINT_GAME_POPUP_TIMER: 20,

    MAXIMUM_TABLE_CREATE_LIMIT: NUMERICAL.THREE,

    //keys
    APP_KEY: processEnv[APP_KEY],
    APP_DATA: processEnv[APP_DATA],
    SECRET_KEY: processEnv[seceretKey],

    GAME_ID: processEnv[GAME_ID],
    VERIFY_USER_PROFILE: `${processEnv[API_BASE_URL]}/gameServerApi/checkIsValidToken`,
    GET_USER_OWN_PROFILE: `${processEnv[API_BASE_URL]}/gameServerApi/getUsersOwnProfile`,
    DEDUCT_USER_ENTRY_FEE: `${processEnv[API_BASE_URL]}/gameServerApi/deductEntryFee`,
    MULTI_PLAYER_SUBMIT_SCORE: `${processEnv[API_BASE_URL]}/gameServerApi/multiPlayerSubmitScore`,
    GAME_SETTING_MENU_HELP: `${processEnv[API_BASE_URL]}/gameServerApi/getGameRules`,
    MARK_COMPLETED_GAME_STATUS: `${processEnv[API_BASE_URL]}/gameServerApi/markCompletedGameStatus`,
    GET_ONE_ROBOT: `${processEnv[API_BASE_URL]}/gameServerApi/getBot`,
    CHECK_BALANCE: `${processEnv[API_BASE_URL]}/gameServerApi/checkBalance`,
    REDIUS_CHECK: `${processEnv[API_BASE_URL]}/gameServerApi/getRadiusLocation`,
    FTUE_UPDATE: `${processEnv[API_BASE_URL]}/gameServerApi/userFirstTimeIntrection`,
    CHECK_USER_BLOCK_STATUS: `${processEnv[API_BASE_URL]}/gameServerApi/checkUserBlockStatus`,
    CHECK_MAINTANENCE: `${processEnv[API_BASE_URL]}/gameServerApi/checkMaintanence`,
    ADD_GAME_RUNNING_STATUS: `${processEnv[API_BASE_URL]}/gameServerApi/addRunningGameStatus`,
    MULTI_PLAYER_DEDUCT_ENTRY_FEE: `${processEnv[API_BASE_URL]}/gameServerApi/multiPlayerDeductEntryFee`,
    MULTI_PLAYER_DEDUCT_ENTRY_FEE_FOR_POOL_RUMMY: `${processEnv[API_BASE_URL]}/gameServerApi/multiPlayerDeductEntryFeeForPoolRummy`,
  });
}

const config = () => {
  const { NODE_ENV } = process.env;
  configData = getEnvJSON(NODE_ENV);
  return configData;
};

export = config;
