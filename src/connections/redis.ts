// const redis = require('redis');
import { createClient } from 'redis';
import logger from '../logger';
import { Redis } from '../main';
import getConfig from './config';
const Redlock = require("redlock")
const fs = require("graceful-fs");
import path from 'path';

let connectionsMap: any = null;

const connectionCallback = async () => {
    return new Promise(async (resolve, reject) => {
        const {
            REDIS_HOST,
            REDIS_PASSWORD,
            REDIS_PORT,
            REDIS_DB,
            PUBSUB_REDIS_HOST,
            PUBSUB_REDIS_PORT,
            PUBSUB_REDIS_PASSWORD,
            PUBSUB_REDIS_DB,
            NODE_ENV,
            REDIS_CONNECTION_URL,
            REDIS_KEY,
            REDIS_CRT,
            REDIS_CA
        } = getConfig();

        let counter = 0;
        const redisConfig: {
            socket: {
                host: string,
                port: number
            },
            database: number,
            password?: string
        } = {
            socket: {
                host: REDIS_HOST,
                port: REDIS_PORT,
            },
            database: REDIS_DB,
        };

        const pubSubRedisConfig: {
            socket: {
                host: string,
                port: number
            },
            database: number,
            password?: string
        } = {
            socket: {
                host: PUBSUB_REDIS_HOST,
                port: PUBSUB_REDIS_PORT,
            },
            database: PUBSUB_REDIS_DB,
        };

        if (REDIS_PASSWORD !== "") {
            redisConfig.password = REDIS_PASSWORD;
        }

        if (PUBSUB_REDIS_PASSWORD !== "") {
            pubSubRedisConfig.password = REDIS_PASSWORD;
        }

        logger.info('redis :: data :: ', redisConfig);
        logger.info('redis pubsub ::  data :: ', pubSubRedisConfig);
        logger.info('redis ::  NODE_ENV :: ', NODE_ENV);
        
        let client: any = null;
        let pubClient: any = null;
        if (NODE_ENV === "PRODUCTION") {

            // logger.info(`------>> redis :: URL :: `, REDIS_CONNECTION_URL);
            // logger.info(`----->> redis :: URL :: ${REDIS_CONNECTION_URL}/${Number(REDIS_DB)}`)
            // client = createClient({ url: `${REDIS_CONNECTION_URL}/${Number(REDIS_DB)}`  });
            // pubClient = createClient({ url: `${REDIS_CONNECTION_URL}/${Number(REDIS_DB)}` });

            logger.info('Redis :: REDIS_HOST ::>> ', REDIS_HOST, "  REDIS_PORT :: ", REDIS_PORT);
            logger.info('Redis :: REDIS_KEY ::>> ', REDIS_KEY, "  REDIS_CRT :: ", REDIS_CRT, " REDIS_CA ::>> ", REDIS_CA);

            const redisConfig: {
                socket: {
                    host: string,
                    port: number
                    tls: boolean,
                    // maxRetriesPerRequest: number,
                },
                database: number,
                password?: string
            } = {
                socket: {
                    host: REDIS_HOST,
                    port: REDIS_PORT,
                    tls: true,
                    // maxRetriesPerRequest: 251,
                },
                database: REDIS_DB ? REDIS_DB : 0,
            };
            logger.info('Redis :: redisConfig :: ===>> ', redisConfig);

            // logger.info( `rediss://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`);

            client = createClient(redisConfig);
            pubClient = createClient(redisConfig);

            // client = createClient({ url : `redis://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}` });
            // pubClient = createClient({ url : `redis://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}` });

        } else {
            client = createClient(redisConfig);
            pubClient = createClient(redisConfig);

        }

        const subClient = pubClient.duplicate();

        async function check() {
            if (counter === 2) {

                connectionsMap = { client, pubClient, subClient };
                // const flushDB = await client.flushDb();
                // logger.info('redis data :: flushDb ::', flushDB);
                resolve(connectionsMap);
            }
        }

        client.on('ready', () => {
            logger.info('Redis connected successfully.');
            Redis.init(client);
            counter += 1;
            check();
        });

        client.on('error', (error: any) => {
            console.log('CATCH_ERROR : Redis Client error:', error)
            logger.error('CATCH_ERROR : Redis Client error:', error);
            reject(error);
        });

        pubClient.on('ready', () => {
            logger.info('pubClient connected successfully.');
            counter += 1;
            check();
        });

        pubClient.on('error', (error: any) => {
            console.log('CATCH_ERROR : Redis Pub Client error:', error)
            logger.error('CATCH_ERROR : pubClient Client error:', error);
            reject(error);
        });

        await client.connect();
        await pubClient.connect();
        await subClient.connect();

    });
}

let redlock: any = null;

const init = async () => connectionsMap || connectionCallback();

export default { init };



