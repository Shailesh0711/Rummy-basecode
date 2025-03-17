import { cards } from "./cards";
import { groupingCard } from "./playerPlayingTableIf";
import { formatScoreBoardInfoIf } from "./responseIf";

export interface turnObjHistoryIf {
    turnNo: number;
    userId: string;
    cardPoints: number;
    cardPicked: string;
    cardPickUpSocure: string;
    cardDiscarded: string;
    finishCard: string;
    cardState: groupingCard;
    createdAt: Date;
}

export interface turnHistoryIf {
    tableId: string;
    [key: string]: string | turnObjHistoryIf[];
}

export interface playerDetailsOfRoundHistoryIf {
    userId: string;
    userName: string;
    seatIndex: number;
    userStatus: string;
    playingStatus: string;
    gameScore: number;
    dealerScore: number;
    socketId: string;
}


interface tossWinnerPlayerIf {
    userId: string;
    seatIndex: number;
    username: string;
    card: string;
}

interface tossDetailIf {
    userId: string;
    seatIndex: number;
    username: string;
    card: string;
}

export interface tossHistoryIf {
    tossWinnerPlayer: tossWinnerPlayerIf,
    tossDetail: tossDetailIf[]
}

export interface roundHistoryObjIf {
    tableId: string;
    trumpCard: string;
    dealerPlayer?: string;
    roundWinner: string;
    playersDetails: playerDetailsOfRoundHistoryIf[];
    currentRound: number;
    dealType: number;
    tossHistory?: tossHistoryIf | undefined;
}


export interface roundHistoryIf {
    [key: string]: roundHistoryObjIf
}


export interface scoreBoardHistoryIf {
    [key: string]: formatScoreBoardInfoIf;
}

