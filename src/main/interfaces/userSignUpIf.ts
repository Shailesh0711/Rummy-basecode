export interface userSignUpIf {
    _id: string;
    userId: string;
    username: string;
    profilePicture: string;
    lobbyId: string;
    isFTUE: boolean;
    gameId: string;
    fromBack: boolean;
    dealType: number;
    gamePoolType: number;
    maximumSeat: number;
    minPlayer: number;
    authToken: string;
    isBot: boolean;
    bootAmount: number;
    moneyMode : string;
    rummyType: string;
    OldLobbyId?: string;
    balance: number;
    location: locationIf;
    platformCommission : number;

    isSplit : boolean;
}

export interface userIf {

    _id: string;
    userId: string;
    username: string;
    socketId: string;
    profilePicture: string;
    lobbyId: string;
    isFTUE: boolean;
    gameId: string;
    fromBack: boolean;
    dealType: number;
    gamePoolType: number;
    tableId?: string;
    oldTableId?: string[];
    maximumSeat: number;
    minPlayer: number;
    authToken: string;
    isBot: boolean;
    bootAmount: number;
    moneyMode : string;
    rummyType: string;
    OldLobbyId?: string;
    balance: number;
    location: locationIf;
    platformCommission : number;
    createdAt?: Date;
    updatedAt?: Date;
    isSplit : boolean;
}


export interface locationIf {
    latitude: string;
    longitude: string;
}