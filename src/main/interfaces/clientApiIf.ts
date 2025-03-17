export interface checkBalanceIf {
  tournamentId: string;
}


export interface rediusCheckDataRes {
  _id: string;
  gameId: string;
  isGameRadiusLocationOn: boolean;
  LocationRange: string;
  numericId: number;
  createdAt: string;
  updatedAt: string;
}

export interface multiPlayerDeductEntryFeeResponse {
  isMinPlayerEntryFeeDeducted: boolean;
  isInsufficiantBalance: boolean;
  insufficiantBalanceUserIds: Array<string>;
  deductedUserIds: Array<string>;
  notDeductedUserIds: Array<string>;
  deductedEntryFeesData: Array<any>;
  refundedUserIds: Array<string>;
}

export interface multiPlayerDeductEntryFeeIf {
  tableId: string;
  tournamentId: string;
  userIds: Array<string>;
}

export interface upadedBalanceIf {
  userId: string;
  balance: number;
}

export interface formateScoreIf {
  userId: string;
  score: number;
  rank?: string;
  winningAmount?: string;
  winLossStatus?: string;
}

export interface multiPlayerWinnScoreIf {
  tableId: string;
  tournamentId: string;
  startGameTime: Date;
  endGameTime: Date;
  playersScore: formateScoreIf[]
}

export interface playersDataIf {
  userId: string;
  winningAmount: number;
  winLossStatus: string;
  score: number,
  rank?: string;
}

export interface markCompletedGameStatusIf {
  tableId: string;
  tournamentId: string;
  gameId: string;
}

export interface addGameRunningStatusIf {
  tableId: string;
  tournamentId: string;
  gameId: string;
}

export interface firstTimeIntrectionInput {
  gameId: string;
  gameModeId?: string;
}

export interface multiPlayerDeductEntryFeeForPoolRummyIf {
  tournamentId: string;
  tableId: string;
  userId: string;
}
