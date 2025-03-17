import httpServer from "./http"
import rdsOps from './redis';
import socketOps from './socket';
import config from './config';
import mongo from './mongo';

const exportObject = {
    httpServer,
    rdsOps,
    socketOps,
    config,
    mongo
}

export = exportObject