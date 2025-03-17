import { EVENTS } from "../../../constants";
import logger from "../../../logger";
import socketAck from "../../../socketAck"
import commonEventEmitter from "../../commonEventEmitter";


function heartBeat(data: any, socket: any, ack: Function) {
    try {
        const response = data.data
        
        commonEventEmitter.emit(EVENTS.HEART_BEAT_SOCKET_EVENT, {
            socket,
            data: response
        })

    } catch (error) {
        logger.error("HEART BEAT HANDLER :: EROOR ::", error)
    }
}

export = heartBeat