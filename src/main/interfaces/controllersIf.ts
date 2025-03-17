export interface resDataI {
    lobbyId: string;
    gameId: string;
}

export interface addLobbyDetailsIf {
    tableId: string;
    lobbyId: string;
    entryFee: number;
    winningAmount: number;
    noOfPlayer: number;
    totalRound: number;
    createdAt: string;
  }


  export interface flageDataIf {
    gameId: string;
    isPlayingTracking: boolean;
    noOfLastTrakingDays: number;
  }

  export interface blockUserCheckI {
    tableId : string
    isNewTableCreated : boolean
  }
  