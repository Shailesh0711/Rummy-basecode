import sendHeartBeat from './heartBeat';
import signUpHandler from './signUp';
import cardsSortHandler from "./cardsSort"
import groupCardHandler from "./groupCard";
import endDragHandler from "./endDrag";
import pickUpCardFromCloseDeckHandler from "./pickUpCardFromCloseDeck";
import pickUpCardFromOpenDeckHandler from "./pickUpCardFromOpenDeck";
import discardCardHandler from "./discardCard";
import dropRoundHandler from "./dropRound";
import finishTimerStartHandler from "./finishTimerStart"
import declareHandler from "./declareEvent"
import leaveTableEventHandler from "./leaveTable"
import viewScoreBoardHandler from "./viewScoreBoard";
import showOpenDeckCardsHandler from "./showOpenDeckcards";
import settingManuTableInfoHandler from './settingManuTableInfo';
import switchTableHandler from './swichTable';
import rejoinGameAgain from './rejoinGameAgain';

const exportObject = {
    sendHeartBeat,
    signUpHandler,
    cardsSortHandler,
    groupCardHandler,
    endDragHandler,
    pickUpCardFromCloseDeckHandler,
    pickUpCardFromOpenDeckHandler,
    discardCardHandler,
    dropRoundHandler,
    finishTimerStartHandler,
    declareHandler,
    leaveTableEventHandler,
    viewScoreBoardHandler,
    showOpenDeckCardsHandler,
    settingManuTableInfoHandler,
    switchTableHandler,
    rejoinGameAgain,
}

export = exportObject