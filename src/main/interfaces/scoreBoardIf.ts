import { cards } from "./cards";


export interface UserInfoIf {
    userName: string;
    userId: string;
    seatIndex: number;
    profilePicture: string;
    DealScore: number;
    gameScore: string | number;
    Status: string;
    dealType?: number;
    poolType?: number;
    cards: cards[];
    message: string;
    socketId: string;
    tableId: string;
    isDeclared: boolean;
    isSwitchTable?: boolean;
}
export interface playerInfoIf {
    // userName: string,
    userId: string,
    seatIndex: number,
    // profilePicture: string,
    // DealScore: number,
    gameScore: number,
    Status: string,
    dealType: number;
    poolType: number;
    socketId: string;
    // cards: cards[]
}


export interface splitPlayerDataIf {
    userId: string;
    seatIndex: number;
}

export interface ScoreObjIf {
    usersId: string[]
    userName: string[]
    score: (string | number)[][];
    totalScore: number[];
}
