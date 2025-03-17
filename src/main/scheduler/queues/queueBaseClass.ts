import Bull from "bull";
import config from "../../../connections/config";
import logger from "../../../logger";
import url from "url";
const fs = require("graceful-fs");
import path from 'path';

class QueueBaseClass {
    public queue: any;

    constructor(queueName: string) {
        const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB, NODE_ENV, REDIS_CONNECTION_URL, REDIS_KEY, REDIS_CRT, REDIS_CA } = config();

        const redisConfig: {
            host: string,
            port: number,
            db: number,
            password?: string,
            // maxRetriesPerRequest: any
        } = {
            host: REDIS_HOST,
            port: REDIS_PORT,
            db: REDIS_DB ? REDIS_DB : 0,
            // maxRetriesPerRequest: 251,
        }

        if (REDIS_PASSWORD !== "") {
            redisConfig.password = REDIS_PASSWORD
        }

        if (NODE_ENV === "PRODUCTION") {

            logger.info('Bull :: REDIS_HOST ::>> ', REDIS_HOST, "  REDIS_PORT :: ", REDIS_PORT);
            logger.info('Bull :: redisConfig :: ===>> ', redisConfig);
            this.queue = new Bull(queueName, { redis: redisConfig })

        } else {
            this.queue = new Bull(queueName, { redis: redisConfig })
        }
    }
}

export default QueueBaseClass;
