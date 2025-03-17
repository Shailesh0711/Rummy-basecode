import { EVENTS, EVENT_EMITTER } from "../../constants";
import logger from "../../logger";
import commonEventEmitter from "../commonEventEmitter";
import waitForPlayers from "../gamePlay/matchMaking/insertPlayer/waitForPlayers";
import { initializeGameplayForFirstRound } from "../gamePlay/signUp";
import tossCardTimer from "../gamePlay/play/cards/tossCardTimer";
import { addClientInRoom, getAllSocket, leaveClientInRoom, sendEventToClient, sendEventToRoom } from "../socket";
import startRound from "../gamePlay/play/rounds/startRound";
import playerFirstTurn from "../gamePlay/play/turn/playerFirstTurn";
import { nextPlayerTurn } from "../gamePlay/play/turn/nextPlayerTurn";
import reShuffleCards from "../gamePlay/play/cards/reShuffleCards";
import { remainDeclareTimeExpire, startFinishTimerExpire } from "../gamePlay/play/playerDeclared/expireTimer";
import nextRoundStartTimerExpire from "../gamePlay/play/rounds/nextRoundTimerExpire";
import { lockInPeriodStart } from "../gamePlay/play/helper";
import leaveTableTimeOut from "../gamePlay/play/leaveTable/leaveTableTimeOut/index.ts";
import scoreBoardTimerExpire from "../gamePlay/play/scoreBoard/scoreBoardTimerExpire";
import secondaryTurn from "../gamePlay/play/turn/secondaryTurn";
import Scheduler from "../scheduler"
import autoSplitTimerExpire from "../gamePlay/play/splitAmount/splitTimerExpire/autoSplitTimerExpire";
import { rejoinGameTimerExpire } from "../gamePlay/play/scoreBoard/rejoinGameTimerExpire";

function showPopUpMessages(payload: any) {
    const { socket, tableId, data } = payload;
    const responseData = {
        en: EVENTS.SHOW_POP_SOCKET_EVENT,
        data,
    };
    logger.info('showPopUpMessages : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('showPopUpMessages : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    } else {
        sendEventToRoom(tableId, responseData);
    }
}

function heartBeatEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.HEART_BEAT_SOCKET_EVENT,
        data,
    };
    sendEventToClient(socket, responseData);
}

function signupEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.SIGN_UP_SOCKET_EVENT,
        data,
    };
    logger.info('signupEvent : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('signupEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function addPlayInTableRoomEvent(payload: any) {
    const { socket, data } = payload;
    addClientInRoom(socket, data.tableId);
}

function joinTableEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.JOIN_TABLE_SOCKET_EVENT,
        data,
    };
    sendEventToRoom(tableId, responseData);
}

function waitEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENT_EMITTER.WAIT_SOCKRT_EVENT,
        data,
    };
    sendEventToRoom(tableId, responseData);
}

function waitingForPlayerEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.WAITING_FOR_PLAYER_SOCKET_EVENT,
        data,
    };
    sendEventToRoom(tableId, responseData);
}

function roundStartEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.ROUND_TIMER_STARTED_SOCKET_EVENT,
        data,
    };
    sendEventToRoom(tableId, responseData);
}

function lockInGameEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.LOCK_IN_PERIOD_POPUP_SCOKET_EVENT,
        data,
    };
    sendEventToRoom(tableId, responseData);
}


function showUpdatedUserBalanceEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.COLLECT_BOOT_VALUE_SOCKET_EVENT,
        data,
    };
    logger.info('showUpdatedUserBalanceEvent : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('showUpdatedUserBalanceEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function tossCardEvent(payload: any) {
    const { tableId, data, socket } = payload;
    const responseData = {
        en: EVENTS.TOSS_CARD_SOCKET_EVENT,
        data,
    };
    if(socket){
        sendEventToClient(socket, responseData);
    }

    if(tableId){
        sendEventToRoom(tableId, responseData);
    }
}

function setDealerEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.SET_DEALER_SOCKET_EVENT,
        data,
    };
    sendEventToRoom(tableId, responseData);
}


function providedCardEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.PROVIDED_CARDS_SOCKET_EVENT,
        data,
    };
    logger.info('providedCardEvent : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('providedCardEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function userTurnEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.USER_TURN_STARTED,
        data,
    };
    logger.info('userTurnEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function sortCardEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.CARDS_IN_SORTS,
        data,
    };
    logger.info('sortCardEvent : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('sortCardEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function groupCardEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.GROUP_CARD_SOCKET_EVENT,
        data,
    };
    logger.info('groupCardEvent : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('groupCardEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function endDragEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.END_DRAG_SOCKET_EVENT,
        data,
    };
    logger.info('endDragEvent : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('endDragEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function pickUpFromCloseDeckEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.PICK_CARD_FROM_CLOSE_DECK,
        data,
    };
    logger.info('pickUpFromCloseDeckEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function pickupFromOpenDeckEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.PICK_CARD_FROM_OPEN_DECK,
        data,
    };
    logger.info('pickupFromOpenDeckEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function reshuffleCardEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.RE_SHUFFLE_CARD,
        data,
    };
    logger.info('reshuffleCardEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function discardCardEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.DISCARD_CARD,
        data,
    };
    logger.info('discardCardEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function dropRoundEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.DROP_ROUND,
        data,
    };
    logger.info('dropRoundEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function finishTimerEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.FINISH_TIMER_STARTED,
        data,
    };
    logger.info('finishTimerEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function declaredEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.DECLARE,
        data,
    };
    logger.info('declaredEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function scoreBoradEvent(payload: any) {
    const { tableId, data, socket } = payload;
    const responseData = {
        en: EVENTS.SCORE_BORAD,
        data,
    };
    logger.info('scoreBoradEvent : responseData :: ', responseData)
    if (tableId) {
        sendEventToRoom(tableId, responseData);
    } else if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function declareInScoreboardEvent(payload: any) {
    const { data, socket } = payload;
    const responseData = {
        en: EVENTS.DECLARE_IN_SCORE_BOARD,
        data,
    };
    logger.info('scoreBoradEvent : responseData :: ', responseData)

    sendEventToClient(socket, responseData);

}

function scoreBoardTimerAndSplitEvent(payload: any) {
    const { tableId, data, socket } = payload;
    const responseData = {
        en: EVENTS.SCOREBOARD_TIMER_AND_SPLIT,
        data,
    };
    logger.info('scoreBoardTimerAndSplitEvent : responseData :: ', responseData)
    if (tableId) {
        sendEventToRoom(tableId, responseData);
    }
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function winnerEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.WINNER,
        data,
    };
    logger.info('winnerEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function leftEvent(payload: any) {
    const { tableId, socket, data } = payload;
    const responseData = {
        en: EVENTS.LEAVE_TABLE,
        data,
    };
    logger.info('leftEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
    if (tableId && socket) {
        logger.info('leftEvent : leave table socket :: ')
        leaveClientInRoom(socket, tableId)
    }
}

function lastDealEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.SCORE_BORAD, // last deal manage in scoreboard event
        data,
    };
    logger.info('lastDealEvent : typeof socket !== undefined :: ', typeof socket !== undefined)
    logger.info('lastDealEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function reJoinEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.RE_JOIN_TABLE,
        data,
    };
    logger.info('reJoinEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function splitAmountEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.SPLIT_AMOUNT,
        data,
    };
    logger.info('splitAmountEvent : responseData :: ', responseData)
    sendEventToClient(socket, responseData);
}
function manualSplitAmountEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.MANUAL_SPLIT_AMOUNT,
        data,
    };
    logger.info('splitAmountEvent : responseData :: ', responseData)
    sendEventToClient(socket, responseData);
}

function splitAmountDeclareEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.SPLIT_AMOUNT_DECLARE,
        data,
    };
    logger.info('splitAmountEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function showOpenDeckEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.SHOW_OPENDECK_CARDS_EVENT,
        data,
    };
    logger.info('showOpenDeckEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}
function settingMenuTableInfoEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.SETTING_MENU_GAME_TABLE_INFO,
        data,
    };
    logger.info('settingMenuTableInfoEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function newGameStartEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.NEW_GAME_START_SOCKET_EVENT,
        data,
    };
    logger.info('newGameStartEvent : tableId :: ', tableId)
    logger.info('newGameStartEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function scoreCardEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.SCORE_CARD,
        data,
    };
    logger.info('scoreCardEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}

function arrangeSeatingEvent(payload: any) {
    const { tableId, data } = payload;
    const responseData = {
        en: EVENTS.ARRANGE_SEATING,
        data,
    };
    logger.info('arrangeSeatingEvent : responseData :: ', responseData)
    sendEventToRoom(tableId, responseData);
}

function rejoinGameAgainEvent(payload: any) {
    const { socket, data } = payload;
    const responseData = {
        en: EVENTS.REJOIN_GAME_AGAIN,
        data,
    };
    logger.info('scoreCardEvent : responseData :: ', responseData)
    if (socket) {
        sendEventToClient(socket, responseData);
    }
}


// ENENTS

commonEventEmitter.on(EVENTS.SHOW_POP_SOCKET_EVENT, showPopUpMessages);

commonEventEmitter.on(EVENTS.HEART_BEAT_SOCKET_EVENT, heartBeatEvent);

commonEventEmitter.on(EVENTS.SIGN_UP_SOCKET_EVENT, signupEvent);

commonEventEmitter.on(EVENTS.ADD_PLAYER_IN_TABLE_ROOM, addPlayInTableRoomEvent);

commonEventEmitter.on(EVENTS.JOIN_TABLE_SOCKET_EVENT, joinTableEvent);

commonEventEmitter.on(EVENTS.WAITING_FOR_PLAYER_SOCKET_EVENT, waitingForPlayerEvent)

commonEventEmitter.on(EVENTS.LOCK_IN_PERIOD_POPUP_SCOKET_EVENT, lockInGameEvent)

commonEventEmitter.on(EVENTS.ROUND_TIMER_STARTED_SOCKET_EVENT, roundStartEvent)

commonEventEmitter.on(EVENTS.COLLECT_BOOT_VALUE_SOCKET_EVENT, showUpdatedUserBalanceEvent)

commonEventEmitter.on(EVENTS.TOSS_CARD_SOCKET_EVENT, tossCardEvent);

commonEventEmitter.on(EVENTS.SET_DEALER_SOCKET_EVENT, setDealerEvent);

commonEventEmitter.on(EVENTS.PROVIDED_CARDS_SOCKET_EVENT, providedCardEvent);

commonEventEmitter.on(EVENTS.USER_TURN_STARTED, userTurnEvent);

commonEventEmitter.on(EVENTS.CARDS_IN_SORTS, sortCardEvent);

commonEventEmitter.on(EVENTS.GROUP_CARD_SOCKET_EVENT, groupCardEvent);

commonEventEmitter.on(EVENTS.END_DRAG_SOCKET_EVENT, endDragEvent);

commonEventEmitter.on(EVENTS.PICK_CARD_FROM_CLOSE_DECK, pickUpFromCloseDeckEvent);

commonEventEmitter.on(EVENTS.PICK_CARD_FROM_OPEN_DECK, pickupFromOpenDeckEvent);

commonEventEmitter.on(EVENTS.RE_SHUFFLE_CARD, reshuffleCardEvent);

commonEventEmitter.on(EVENTS.DISCARD_CARD, discardCardEvent);

commonEventEmitter.on(EVENTS.DROP_ROUND, dropRoundEvent);

commonEventEmitter.on(EVENTS.FINISH_TIMER_STARTED, finishTimerEvent);

commonEventEmitter.on(EVENTS.DECLARE, declaredEvent);

commonEventEmitter.on(EVENTS.SCORE_BORAD, scoreBoradEvent);

commonEventEmitter.on(EVENTS.DECLARE_IN_SCORE_BOARD, declareInScoreboardEvent);

commonEventEmitter.on(EVENTS.SCOREBOARD_TIMER_AND_SPLIT, scoreBoardTimerAndSplitEvent);

commonEventEmitter.on(EVENTS.WINNER, winnerEvent);

commonEventEmitter.on(EVENTS.LEAVE_TABLE, leftEvent);

commonEventEmitter.on(EVENTS.LAST_DEAL, lastDealEvent);

commonEventEmitter.on(EVENTS.RE_JOIN_TABLE, reJoinEvent);

commonEventEmitter.on(EVENTS.SPLIT_AMOUNT, splitAmountEvent);

commonEventEmitter.on(EVENTS.MANUAL_SPLIT_AMOUNT, manualSplitAmountEvent);

commonEventEmitter.on(EVENTS.SPLIT_AMOUNT_DECLARE, splitAmountDeclareEvent);

commonEventEmitter.on(EVENTS.SHOW_OPENDECK_CARDS_EVENT, showOpenDeckEvent);

commonEventEmitter.on(EVENTS.SETTING_MENU_GAME_TABLE_INFO, settingMenuTableInfoEvent);

commonEventEmitter.on(EVENTS.NEW_GAME_START_SOCKET_EVENT, newGameStartEvent);

commonEventEmitter.on(EVENTS.SCORE_CARD, scoreCardEvent);

commonEventEmitter.on(EVENTS.ARRANGE_SEATING, arrangeSeatingEvent);

commonEventEmitter.on(EVENTS.REJOIN_GAME_AGAIN, rejoinGameAgainEvent);

//EVENT EMITTER
commonEventEmitter.on(EVENT_EMITTER.WAIT_SOCKRT_EVENT, waitEvent)

commonEventEmitter.on(EVENT_EMITTER.WAITING_PLAYERS_EVENT_END, waitForPlayers);

commonEventEmitter.on(EVENT_EMITTER.INITIALIZE_GAME_PLAY, initializeGameplayForFirstRound);

commonEventEmitter.on(EVENT_EMITTER.BOOT_AMOUNT_COLLECTION_TIMER, tossCardTimer);

commonEventEmitter.on(EVENT_EMITTER.ROUND_STARTED, startRound);

commonEventEmitter.on(EVENT_EMITTER.START_FIRST_TURN, playerFirstTurn);

commonEventEmitter.on(EVENT_EMITTER.USER_TURN_EXPIRE, secondaryTurn);

commonEventEmitter.on(EVENT_EMITTER.SEONDARY_TIMER_EXPIRE, nextPlayerTurn);

commonEventEmitter.on(EVENT_EMITTER.RE_SHUFFLE_TIMER_EXPIRE, reShuffleCards);

commonEventEmitter.on(EVENT_EMITTER.CANCAL_START_TURN_TIMER, nextPlayerTurn);

commonEventEmitter.on(EVENT_EMITTER.START_FINISH_TIMER_EXPIRE, startFinishTimerExpire);

commonEventEmitter.on(EVENT_EMITTER.REMAIN_PLAYERS_TIMER_EXPIRE, remainDeclareTimeExpire);

commonEventEmitter.on(EVENT_EMITTER.SCORE_BOARD_TIMER_EXPIRE, scoreBoardTimerExpire);

commonEventEmitter.on(EVENT_EMITTER.LEAVE_TABLE_TIME_OUT, leaveTableTimeOut)

commonEventEmitter.on(EVENT_EMITTER.LOCK_IN_PERIOD_START, lockInPeriodStart)

commonEventEmitter.on(EVENT_EMITTER.NEXT_ROUND_START_TIMER_EXPIRE, nextRoundStartTimerExpire);

commonEventEmitter.on(EVENT_EMITTER.AUTO_SPLIT_TIMER_EXPIRE, autoSplitTimerExpire);

commonEventEmitter.on(EVENT_EMITTER.START_COLLECT_BOOT_TIMER_QUEUE, async (data: any) => {
    await Scheduler.addJob.BootAmountCollect(data);
});

commonEventEmitter.on(EVENT_EMITTER.REJOIN_GAME_TIMER_EXPIRE, rejoinGameTimerExpire);