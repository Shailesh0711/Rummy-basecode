export interface defaultRoundTableIf {
    tableId: string;
    totalPlayers: number;
    dealType: number;
    rummyType: string;
}

export interface roundTableIf {
    _id: string;
    tableId: string;
    tableState: string;
    trumpCard: string;
    closedDeck: Array<string>;
    opendDeck: Array<string>;
    finishDeck: Array<string>;
    nextRoundStartTimer: number;
    totalPlayers: number;
    currentPlayer: number;
    totalDealPlayer: number;
    splitPlayers: number;
    maxPlayers: number;
    currentRound: number;
    dealType: number;

    rummyType: string;

    rejoinGamePlayer: number;
    roundMaxPoint: number;
    eliminatedPlayers: string[];

    validDeclaredPlayer: string;
    validDeclaredPlayerSI: number;
    finishTimerStartPlayerId: string;
    firstTurn: boolean;
    currentTurn: string;
    nextTurn: string;
    totalPickCount: number;
    dealerPlayer?: string;
    tossWinnerPlayer?: string;
    winnerPlayer: string;
    seats: userSeatsIf;
    turnCount: number;
    isSplit: boolean;
    isEligibleForSplit: boolean;
    isAutoSplit: boolean;
    isValidDeclared: boolean;
    isDropOrLeave: boolean;
    isPickUpFromOpenDeck: boolean;
    isSecondaryTurn: boolean;
    isCollectBootSend: boolean;
    isGameOver: boolean;

    isWaitingForRejoinPlayer: boolean;
    rejoinGamePlayersName: string[];

    LPAS: number;
    history: Array<any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface userSeatKeyIf {
    _id?: string;
    userId?: string;
    username?: string;
    profilePicture?: string;
    seatIndex?: number;
    userStatus?: string;
    inGame?: boolean;
    gameScore?: number;
}
export interface userSeatKeyIF {
    _id: string;
    userId: string;
    username: string;
    profilePicture: string;
    seatIndex: number;
    userStatus: string;
    inGame?: boolean;
    gameScore?: number;
}

interface IObjectKeys {
    [key: string]: any;
}

// export interface userSeatsIf extends Record<string, any> {
export interface userSeatsIf extends IObjectKeys {
    s0: userSeatKeyIf;
    s1: userSeatKeyIf;
    s2?: userSeatKeyIf;
    s3?: userSeatKeyIf;
    s4?: userSeatKeyIf;
    s5?: userSeatKeyIf;
}


export interface tosscardI {
    userId: string;
    seatIndex: number;
    username: string;
    card: string;
}
