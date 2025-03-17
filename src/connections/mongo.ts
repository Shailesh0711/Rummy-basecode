import logger from "../logger";
import config from "./config";
const { MongoClient } = require("mongodb");


class MongoDB {
    public DB_NAME: any;
    public url: any;
    public db: any;

    constructor() {
        this.DB_NAME = '';
        this.url = null;
        this.db = null;
    }

    getUrl(
        DB_PROTO: string,
        DB_HOST: string,
        DB_PORT: string,
        DB_NAME: string,
        DB_USERNAME: string,
        DB_PASSWORD: string
    ) {
        return `${DB_PROTO}://${DB_HOST}:${DB_PORT}/${DB_NAME}`
        // return `${DB_PROTO}://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`; //?retryWrites=true&w=majority
    }

    async connection(resolve: any, reject: any) {
        const { DB } = await import("../main")
        logger.debug(`this.url :: ${this.url}`);
        MongoClient.connect(
            this.url,
            { useUnifiedTopology: true, useNewUrlParser: true },
            (err: any, client: any) => {
                console.log('===> error <====', err);

                if (err) reject(err);

                this.db = client.db(this.DB_NAME);

                DB.init(this.db, client);

                logger.info('DB Connected successfully!');

                resolve(this.db);
            },
        )
    }

    async init() {
        const { DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD }: any = config();

        this.DB_NAME = DB_NAME;
        this.url = this.getUrl(
            'mongodb',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_USERNAME,
            DB_PASSWORD,
        );
        logger.debug(this.url);
        return new Promise(this.connection.bind(this));
    }
}

export = new MongoDB();