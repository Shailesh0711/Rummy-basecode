export interface playersSplitAmountDetailsIf {
    userId: string;
    amount: number;
    splitStatus: string;
    remainDrops : number;
    socketId: string;
    userName: string;
    gameScore: number;
}


export interface splitAmountDeclareIf {
    userId: string;
    winAmount: number;
    balance: number;
}