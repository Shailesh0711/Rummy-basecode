import logger from "../../logger";
import { BOT } from "../../constants";
import { getSocketClient } from "../../connections/socket";



async function sendEventToClient(socket: any, data: any) {
    try {
        const socketClient = getSocketClient();
        if (data.en != 'HEART_BEAT') logger.debug('SEND EVENT TO CLIENT: ', data);
        let encData = JSON.stringify(data);

        if (typeof socket !== "string" && socket.emit) {
            socket.emit(data.en, encData)
        } else {
            socketClient.to(socket).emit(data.en, encData)
        }
    } catch (error) {
        console.log(error)
        logger.error('SEND EVENT TO CLIENT  :: ERROR :: ', error);
    }
}

async function sendEventToRoom(roomId: any, data: any) {
    try {
        const socketClient = getSocketClient();
        logger.debug('SEND EVENT TO ROOM roomId socketClient', typeof socketClient);
        logger.debug('SEND EVENT TO ROOM roomId', roomId);
        logger.debug('SEND EVENT TO ROOM', data);

        let encData = JSON.stringify(data);

        socketClient.to(roomId).emit(data.en, encData);

    } catch (error) {
        logger.error('SEND ENEVT TO ROOM :: ERROR :: ', error);
        console.log(error)
    }
}

async function addClientInRoom(socket: any, roomId: any) {
    if (socket.id !== "FTUE_BOT_ID" && socket.id !== BOT.ID) {
        logger.debug("addClientInRoom :: ", roomId)
        return socket.join(roomId)
    } else {
        let socketInstance = await getSocketFromSocketId(socket);
        if (socketInstance && socketInstance.join) {
            socketInstance.join(roomId)
        }
    }
}

async function leaveClientInRoom(socket: any, roomId: any) {
    try {
        if (typeof socket != 'undefined' && socket.emit) {
            socket.leave(roomId);
        } else {
            let socketInstance = await getSocketFromSocketId(socket);
            if (socketInstance && socketInstance.leave) {
                socketInstance.leave(roomId)
            }
        }
    } catch (error) {
        console.log("LEAVE CLIENT SOCKET ROOM :: ERROR ::", error)
        logger.error("LEAVE CLIENT SOCKET ROOM :: ERROR ::", error)
    }
}

export async function getSocketFromSocketId(socketId: string) {
    try {
        const socketClient = await getSocketClient();
        return socketClient.sockets.sockets.get(socketId);
    } catch (error) {
        logger.error("GET SOCKET FROM SOCKET ID :: EROOR ::", error)
    }
}

async function getAllSocket(tableId: string) {
    try {
        const socketClient = getSocketClient();
        return await socketClient.in(tableId).fetchSockets();

    } catch (error) {
        logger.error("GET ALL SOCKET FROM ROOM :: EROOR ::", error)
    }
}

async function joinRoomSocketId(roomId: string) {
    try {
        const socketClient = getSocketClient();
        const sockets = await socketClient.sockets.adapter.rooms.get(roomId);
        logger.info("----->> joinRoomSocketId :: sockets IDS :: ", sockets)
        // const setArrary = Array.from(sockets)
        const setArrary = [...sockets];
        logger.info("----->> joinRoomSocketId :: setArrary :: ", setArrary)

        return setArrary;

    } catch (error) {
        logger.error("------ joinRoomSocketId :: EROOR ::", error);
        throw error;
    }
}

export {
    sendEventToClient,
    sendEventToRoom,
    addClientInRoom,
    leaveClientInRoom,
    getAllSocket,
    joinRoomSocketId
}