const http = require("http");
const https = require("https")
const express = require("express");
const cors = require('cors');
const fs = require("graceful-fs");
const bodyParser = require("body-parser");
const app = express();
import path from 'path';
import config = require('./config');
import logger = require('../logger');
import router from '../main/routes';

let httpserver: any;

const { CRT_FILE, KEY_FILE } = config()

app.get(`/test`, (req: any, res: any) => {
    res.send(`Okey...!`)
})

app.use(express.json());
app.use("/",router)

if (
    fs.existsSync(path.join(__dirname, KEY_FILE)) &&
    fs.existsSync(path.join(__dirname, CRT_FILE))
) {
    // creating https secure socket server
    let options = {
        key: fs.readFileSync(path.join(__dirname, KEY_FILE)),
        cert: fs.readFileSync(path.join(__dirname, CRT_FILE)),
    };
    logger.info('creating https app');
    httpserver = https.createServer(options, app);
} else {
    // creating http server
    logger.info('creating http app');
    httpserver = http.createServer(app);
}

export = httpserver;