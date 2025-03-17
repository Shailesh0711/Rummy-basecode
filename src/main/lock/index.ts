import logger from "../../logger";
const Redlock = require('redlock');
import config from "../../connections/config";
// const ioredis = require("ioredis")

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
// const redisA = new ioredis(redisConfig);

// logger.info( `rediss://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`);
// const redisA = new ioredis(`rediss://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`);

let redlock: any = null;

function registerRedlockError(): void {
    redlock.on('error', (error: any) => logger.error('REDIS_LOCK_ERROR', error));
}

async function initializeRedlock(client: any) {

    if (redlock) return redlock;

    redlock = new Redlock([client], {
        // The expected clock drift; for more details see:
        driftFactor: 0.01, // multiplied by lock ttl to determine drift time
        // ∞ retries
        retryCount: -1,
        // the time in ms between attempts
        retryDelay: 200, // time in ms
        // the max time in ms randomly added to retries
        // to improve performance under high contention
        retryJitter: 200, // time in ms
        // The minimum remaining time on a lock before an extension is automatically
        // attempted with the `using` API.
        automaticExtensionThreshold: 500
    });
    logger.info("REDIS -->> initializeRedlock :: Done.");

    registerRedlockError();

    return redlock;
}

function getLock() {
    return redlock
}

const exportObject = {
    init: initializeRedlock,
    getLock
}

export = exportObject
