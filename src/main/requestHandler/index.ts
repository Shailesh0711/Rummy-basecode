import { EVENTS } from "../../constants";
import logger from "../../logger";
import { cardsSortHandler, declareHandler, discardCardHandler, dropRoundHandler, endDragHandler, finishTimerStartHandler, leaveTableEventHandler, pickUpCardFromCloseDeckHandler, pickUpCardFromOpenDeckHandler, sendHeartBeat, showOpenDeckCardsHandler, signUpHandler, viewScoreBoardHandler } from "./requestHelper";
import groupCardHandler from "./requestHelper/groupCard";
import manualSplitAmountHandler from "./requestHelper/manualSplitAmount";
import rejoinGameAgain from "./requestHelper/rejoinGameAgain";
import scoreCard from "./requestHelper/scoreCard";
import settingManuTableInfoHandler from "./requestHelper/settingManuTableInfo";
import splitAmountHandler from "./requestHelper/splitAmount";
import switchTableHandler from "./requestHelper/swichTable";


async function requestHandler(
    this: any,
    [reqEventName, payload, ack]: Array<any>,
    // @ts-ignore
    next,
): Promise<boolean> {

    const socket: any = this;

    const body = payload = typeof payload === "string" ? JSON.parse(payload) : payload;

    if (!socket) {
        logger.error(new Error('socket instance not found'));
    }

    if (body.en !== EVENTS.HEART_BEAT_SOCKET_EVENT) {
        logger.warn("======>>> Event : Unity-Side ==>>", body)
        logger.warn("======>>> Event : Unity-Side ==>>", reqEventName)
    }

    socket.userId = socket.userId;
    const data = body;

    try {
        switch (reqEventName) {

            case EVENTS.HEART_BEAT_SOCKET_EVENT:
                await sendHeartBeat(data, socket, ack);
                break;

            case EVENTS.SIGN_UP_SOCKET_EVENT:
                await signUpHandler(data, socket, ack)
                break;

            case EVENTS.CARDS_IN_SORTS:
                await cardsSortHandler(data, socket, ack)
                break;

            case EVENTS.GROUP_CARD_SOCKET_EVENT:
                await groupCardHandler(data, socket, ack)
                break;

            case EVENTS.END_DRAG_SOCKET_EVENT:
                await endDragHandler(data, socket, ack)
                break;

            case EVENTS.PICK_CARD_FROM_CLOSE_DECK:
                await pickUpCardFromCloseDeckHandler(data, socket, ack)
                break;

            case EVENTS.PICK_CARD_FROM_OPEN_DECK:
                await pickUpCardFromOpenDeckHandler(data, socket, ack)
                break;

            case EVENTS.DISCARD_CARD:
                await discardCardHandler(data, socket, ack);
                break;

            case EVENTS.DROP_ROUND:
                await dropRoundHandler(data, socket, ack);
                break;

            case EVENTS.FINISH_TIMER_STARTED:
                await finishTimerStartHandler(data, socket, ack);
                break;

            case EVENTS.DECLARE:
                await declareHandler(data, socket, ack);
                break;

            case EVENTS.LEAVE_TABLE:
                await leaveTableEventHandler(data, socket, ack);
                break;

            case EVENTS.MANUAL_SPLIT_AMOUNT:
                await manualSplitAmountHandler(data, socket, ack);
                break;

            case EVENTS.SPLIT_AMOUNT:
                await splitAmountHandler(data, socket, ack);
                break;

            case EVENTS.LAST_DEAL:
                await viewScoreBoardHandler(data, socket, ack);
                break;

            case EVENTS.SHOW_OPENDECK_CARDS_EVENT:
                await showOpenDeckCardsHandler(data, socket, ack);
                break;

            case EVENTS.SETTING_MENU_GAME_TABLE_INFO:
                await settingManuTableInfoHandler(data, socket, ack);
                break;

            case EVENTS.SCORE_CARD:
                await scoreCard(data, socket, ack);
                break;

            case EVENTS.SWITCH_TABLE_SOCKET_EVENT:
                await switchTableHandler(data, socket, ack);
                break;

            case EVENTS.REJOIN_GAME_AGAIN:
                await rejoinGameAgain(data, socket, ack);
                break;

            default:
                logger.info("<<====== Default Event :: Call ========>>");
                break;
        }
    } catch (error) {
        logger.error(
            'EVENT REQUEST HANDLER :: ERROR :: ',
            reqEventName,
            error,
        );
    }

    return false;
}


export = requestHandler;