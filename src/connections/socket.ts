const SocketIO = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
import server from './http';
import { SOCKET, MESSAGES, NUMERICAL, REDIS } from '../constants';
import requestHandler from '../main/requestHandler';
import logger from '../logger';
import redis from './redis';
import userDisconnect from '../main/gamePlay/signUp/userDisconnect';
import { decrCounter, getOnliPlayerCount, incrCounter, setCounterIntialValue } from '../main/gamePlay/cache/onlinePlayer';

let socketClient: any;

async function connectionCB(client: any) {
    try {
        logger.info(MESSAGES.SOCKET.INTERNAL.NEW_CONNECTION, client.id);

        const token = client.handshake.auth.token;
        const userId = client.handshake.auth.userId; // remove
        logger.info('connectionCB token : ', token);
        logger.info('connectionCB userId : ', userId);
        client.authToken = token;

        // console.log("socket :::" ,client)

        let getOnlinePlayerCount = await getOnliPlayerCount(REDIS.PREFIX.ONLINEPLAYER);
        logger.info("socket connection :: getOnlinePlayerCount :>>", getOnlinePlayerCount);

        if (!getOnlinePlayerCount) {
            const counterIntialValue = await setCounterIntialValue(REDIS.PREFIX.ONLINEPLAYER);
        }

        let count = await incrCounter(REDIS.PREFIX.ONLINEPLAYER);
        logger.info("socket connection :: count :: ", count);

        client.conn.on(SOCKET.PACKET, (packet: any) => {

            if (packet.type === 'ping') {
            }
        });

        /**
         * error event handler
         */
        client.on(SOCKET.ERROR, (error: any) =>
            logger.error('CATCH_ERROR : Socket : client error......,', error),
        );

        /**
         * disconnect request handler
         */
        client.on(SOCKET.DISCONNECT, async (dis: any) => {
            await decrCounter(REDIS.PREFIX.ONLINEPLAYER);
            console.log("disconnect...");
            userDisconnect(client, dis);
        })

        /**
         * bind requestHandler
         */

        client.use(requestHandler.bind(client));
    } catch (error) {
        console.log("error: ", error);
    }
}

const createSocketServer = async () => {
    const { pubClient, subClient } = await redis.init();


    if (!pubClient || !subClient) {
        process.exit(1);
    }

    if (!socketClient) {
        const socketConfig = {
            transports: [SOCKET.WEBSOCKET, SOCKET.POLLING],
            pingInterval: 4000, // to send ping/pong events for specific interval (milliseconds)
            pingTimeout: NUMERICAL.TEN_THOUSAND, // if ping is not received in the "pingInterval" seconds then milliseconds will be disconnected in "pingTimeout" milliseconds
            allowEIO3: true,
        };

        socketClient = SocketIO(server, socketConfig);

        socketClient.adapter(createAdapter(pubClient, subClient));

        socketClient.on(SOCKET.CONNECTION, connectionCB);
    }

    return socketClient;
};

export const getSocketClient = () => {
    return socketClient;
}

const exportObject = {
    createSocketServer
};

export default exportObject;
