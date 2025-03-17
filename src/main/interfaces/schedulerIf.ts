import { pickupCardFromCloseDeckRequestIf } from "./requestIf";


export interface waitingForPlayerIf {
    timer: number;
    tableId: string;
    queueKey: string;
    currentRound: number;
    lobbyId: string;
}

export interface initializeGameplayIf {
    timer: number;
    tableId: string;
    queueKey: string;
    currentRound: number;
}


export interface bootAmountCollectQueueIf {
    timer: number;
    tableId: string;
    currentRound: number;
}

export interface tossCardTimerQueueIf {
    timer: number;
    tableId: string;
    currentRound: number;
}
export interface distributeCardsQueueIf {
    timer: number;
    tableId: string;
    currentRound : number;
}
export interface startTurnTimerQueueIf {
    timer: number;
    tableId: string;
    currentTurnPlayerId: string;
    currentRound: number,
    currentPlayerSeatIndex: number;
}

export interface reShuffleCardQueueIf {
    timer: number;
    tableId: string;
    currentTurnPlayerId: string;
    currentRound: number,
    currentPlayerSeatIndex: number;
}

export interface StartFinishTimerQueueIf {
    timer: number;
    tableId: string;
    userId: string;
    currentRound: number,
}
export interface otherPlayersIf {
    userId: string;
    seatIndex: number;
}
export interface RemainPlayersdeclarTimerQueueIf {
    timer: number;
    tableId: string;
    currentRound: number,
    otherPlayerDeclares: otherPlayersIf[];
}

export interface scoreBoardTimerIf {
    timer: number;
    tableId: string;
    currentRound: number,
    isAutoSplit: boolean;
}

export interface leaveTableTimerIf {
    timer: number;
    tableId: string;
    userId: string;
    currentRound: number,
}


export interface lockInPeriodTimerQueueIf {
    timer: number;
    tableId: string;
    queueKey: string;
    currentRound: number,
}

export interface splitAmountTimerIf {
    timer: number;
    tableId: string;
    currentRound: number,
}

export interface NextRoundTimerQueueIf {
    timer: number;
    tableId: string;
    currentRound: number,
}

export interface AutoSplitTimerQueueIf{
    timer: number;
    tableId: string;
    currentRound: number,
}

export interface ScoreBoardLeaveDelayQueueTimerIf{
    timer: number;
    tableId: string;
    currentRound: number,
}

export interface arrageSeatingQueueIf {
    timer: number;
    tableId: string;
    currentRound: number;
}

export interface RejoinGamePopupQueueIf {
    timer: number;
    tableId: string;
    currentRound: number;
    playersId: string[]
}
