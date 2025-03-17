export interface lobbyIF {
    _id: string;
    mode: string;
    totalRound: number;
    totalPlayers: number;
    bot: boolean;
    rake: number;
    bootValue: number;
    isActive: boolean;
    EXTRA_BID_LIMIT: boolean;
    BID_LIMIT_VALUE: number;
    BONUS_CALL: boolean;
  }
  