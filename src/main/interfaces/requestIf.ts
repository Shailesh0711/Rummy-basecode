export interface signUpRequestIf {
    userName: string;
    userId: string;
    profilePic: string;
    lobbyId: string;
    isFTUE: boolean;
    fromBack: boolean;
    dealType: string;
    gamePoolType: string;
    gameId: string;
    minPlayer: number;
    noOfPlayer: number;
    accessToken: string;
    isUseBot: boolean;
    entryFee: number;
    moneyMode: string;
    rummyType: string;
    latitude: string;
    longitude: string;
    platformCommission: number,
    gameModeId : string;
    isSplit : boolean;
}

interface locationI {
    latitude: number,
    longitude: number
}

export interface signUpHelperRequestIf {
    data: signUpRequestIf;
}

export interface matchMakingIf {
    lobbyId: string
}
export interface matchMakingDataIf {
    data: matchMakingIf
}

export interface cardsSortRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface cardsSortHelperRequestIf {
    data: cardsSortRequestIf;
}

export interface groupCardRequestIf {
    userId: string,
    tableId: string,
    currentRound: number,
    cards: string[]
}

export interface groupCardHelperRequestIf {
    data: groupCardRequestIf;
}

export interface endDragRequestIf {
    userId: string,
    tableId: string,
    currentRound: number,
    cards: string[],
    destinationGroupIndex: number;
    cardIndexInGroup: number;
}

export interface endDragHelperRequestIf {
    data: endDragRequestIf;
}

export interface pickupCardFromCloseDeckRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface pickupCardFromCloseDeckHelperRequestIf {
    data: pickupCardFromCloseDeckRequestIf;
}

export interface pickupCardFromOpenDeckHelperRequestIf {
    data: pickupCardFromCloseDeckRequestIf;
}

export interface pickUpCardFromOpenDecRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface pickUpCardFromOpenDecHelperRequestIf {
    data: pickUpCardFromOpenDecRequestIf;
}

export interface discardCardRequestIf {
    userId: string,
    tableId: string,
    currentRound: number,
    cards: string[]
}

export interface discardCardHelperRequestIf {
    data: discardCardRequestIf;
}

export interface dropRoundRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
    dealType?: number;
    poolType? : number,
}

export interface dropRoundHelperRequestIf {
    data: dropRoundRequestIf;
}

export interface finishTimerStartRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
    finishCard: string[];
}

export interface finishTimerStartHelperRequestIf {
    data: finishTimerStartRequestIf;
}

export interface declareRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface declareHelperRequestIf {
    data: declareRequestIf;
}

export interface leaveTableEventRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface leaveTableEventHelperRequestIf {
    data: leaveTableEventRequestIf;
}

export interface viewScoreBoardRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface viewScoreBoardEventHelperReqIf {
    data: viewScoreBoardRequestIf
}

export interface manualSplitAmountRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface manualSplitAmountEventHelperReqIf {
    data: manualSplitAmountRequestIf
}

export interface splitAmountRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
    isSplitAmount: boolean;
}

export interface splitAmountEventHelperReq {
    data: splitAmountRequestIf
}

export interface showOpenDeckCardsrequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface showOpenDeckCardsEventHelperReq {
    data: showOpenDeckCardsrequestIf
}


export interface settingManuTableInfoHandlerIF {
    tableId: string;
    userId: string;
    currentRound: number;
}



export interface settingManuTableInfoHandlerReqIF {
    data: settingManuTableInfoHandlerIF
}

export interface scoreCardReqIf{
    tableId: string;
    userId: string;
    currentRound : number;
 }

 export interface scoreCardHandlerReqIf{
    data : scoreCardReqIf
 }

 export interface switchEventRequestIf {
    userId: string;
    tableId: string;
    currentRound: number;
}

export interface switchEventHelperRequestIf {
    data: switchEventRequestIf;
}

export interface rejoinGameAgainReqIf{
    tableId: string;
    userId: string;
    currentRound : number;
 }

 export interface rejoinGameAgainHandlerReqIf{
    data : rejoinGameAgainReqIf
 }
