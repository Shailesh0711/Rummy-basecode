import logger from "../../logger";
const Redlock = require('redlock');
import config from "../../connections/config";
const ioredis = require("ioredis")
import IORedis from "ioredis"; // Ensure consistency with ioredis

const {
    REDIS_HOST,
    REDIS_PASSWORD,
    REDIS_PORT,
    REDIS_DB
} = config();

const redisConfig: {
    host: string;
    port: number;
    db: number;
    password?: string;
    // maxRetriesPerRequest: any,
    // retryStrategy : any
} = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    db: 0,
    // maxRetriesPerRequest: 500,
    // retryStrategy: (times: any) => {
    //     return Math.min(times * 200, 2000);
    // }
};

if (REDIS_PASSWORD !== '') redisConfig.password = REDIS_PASSWORD;
logger.info("IO REDIS-->> redisConfig :: ", redisConfig);
const redisA = new ioredis(redisConfig);

// logger.info( `rediss://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`);
// const redisA = new ioredis(`rediss://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`);

let redlock: any = null;

function registerRedlockError(): void {
    redlock.on('error', (error: any) => logger.error('REDIS_LOCK_ERROR', error));
}

// 🔒 Initialize Redlock — accepts client as argument now
async function initializeRedlock(client: IORedis) {
    if (redlock) return redlock;
  
    redlock = new Redlock([client], {
      driftFactor: 0.01,
      retryCount: -1,
      retryDelay: 200,
      retryJitter: 200,
      automaticExtensionThreshold: 500,
    });
  
    logger.info("🔒 REDLOCK initialized successfully with provided client");
    registerRedlockError();
  
    return redlock;
  }

function getLock() {
    console.log("🚀 ~ getLock ~ redlock:", redlock)
    return redlock
}

const exportObject = {
    init: initializeRedlock,
    getLock
}

export = exportObject
