import { userSeatKeyIf } from "./roundTableIf";
import { locationIf } from "./userSignUpIf";
import { tosscardI } from "./roundTableIf"
import { cards } from "./cards";
import { UserInfoIf, splitPlayerDataIf } from "./scoreBoardIf";
import { otherPlayersIf } from "./schedulerIf";
import { playersSplitAmountDetailsIf, splitAmountDeclareIf } from "./splitAmount";
import { dropIF } from "./utils";

export interface formatSingUpInfoIf {
  _id: string;
  userId: string;
  username: string;
  socketId: string;
  profilePicture: string;
  lobbyId: string;
  OldLobbyId?: string;
  isFTUE: boolean;
  gameId: string;
  tableId?: string;
  oldTableId?: string;
  maximumSeat: number;
  minPlayer: number;
  fromBack: boolean;
  balance: number;
  bootAmount: number;
  moneyMode: string;
  rummyType: string;
  isBot: boolean;
  location: locationIf;
  authToken: string;
  createdAt?: Date;
  updatedAt?: Date;
  dealType: number;
}


export interface formatGameTableInfoIf {
  isRejoin: boolean;
  totalRounds: number;
  isFTUE: boolean;
  bootAmount: number;
  potValue: number;
  winPrice: number;
  userTurnTimer: number;
  winningScores: Array<number>;
  tableId: string;
  roundTableId: string;
  totalPlayers: number;
  maxPlayers: number;
  currentRound: number;
  seats: Array<userSeatKeyIf>;

  opendDeck: string[];
  finishDeck: string[];
  trumpCard: string[];
  closedDeck: string[];

  dealerPlayer: number;
  validDeclaredPlayerSI: number;
  validDeclaredPlayer : string;
  currentTurnSeatIndex : number;
  currentTurn : string;

  totalTurnTime : number;
  timer : number;

  isSeconderyTimer : boolean;
  isRemainSeconderyTurns : boolean;

  tableState : string;
}


export interface playarDetail {
  _id: string;
  userId: string;
  username: string;
  profilePicture: string;
  seatIndex: number;
  userStatus: string;
  inGame?: boolean;
}

export interface formatJoinTableInfoIf {
  playarDetail: playarDetail;
}


export interface formatBootCollectionInfoIf {
  balance: number;
  listOfSeatsIndex: number[];
  winPrice: number;
}

export interface tossWinnerPlayer {
  userId: string;
  seatIndex: number;
  username: string;
  card: string;
  message?: string;
}


export interface formatTossCardInfoIf {
  tableId: string;
  tossWinnerPlayer: tossWinnerPlayer;
  tossDetail: Array<tosscardI>;
}


export interface setDealerInfoIf {
  tableId: string;
  userId: string;
  username: string;
  seatIndex: number;
  currentRound: number;
}


export interface formatProvidCardInfoIf {
  trumpCard: string[];
  totalPoint: number;
  openDeckCard: string[];
  cards: cards[];
  // closeDeckCard: string[];
}

export interface formatStartTurnInfoIf {
  currentTurnUserId: string,
  currentTurnSI: number,
  previousTurnSI: number,
  turnTimer: number,
  firstTurn: boolean
  isSecondaryTurn: boolean
  isSeconderyTurnsRemain: boolean
}

export interface formatSortCardInfoIf {
  userId: string;
  tableId: string;
  totalPoints: number;
  cards: cards[];
}
export interface formatPickupCloseDeckIf {
  userId: string;
  tableId: string;
  seatIndex: number;
  totalPoints: number;
  cards: cards[];
  pickUpCard: string;
}
export interface formatPickupOpenDeckIf {
  userId: string;
  tableId: string;
  seatIndex: number;
  totalPoints: number;
  cards: cards[];
  openDeck: string[];
  pickUpCard: string;
}

export interface formatReShuffleDeckInfoIf {
  tableId: string;
  opendDeck: string[];
  // closedDeck: string[];
}

export interface formatdiscardCardInfoIf {
  userId: string;
  tableId: string;
  seatIndex: number;
  totalPoints: number;
  cards: cards[];
  discardCard: string[];
  opendDeck: string[];
}
export interface formatDropRoundInfoIf {
  userId: string;
  tableId: string;
  seatIndex: number;
  totalPoints: number;
  cards: cards[];
  isDrop: boolean
}

export interface formatFinishTimerStartIf {
  userId: string,
  tableId: string,
  seatIndex: number,
  turnTimer: number,
  totalScorePoint: number,
  finishCard: string[],
  cards: cards[]
}

export interface formateDeclareInfoIf {
  declareUserId: string,
  declareSeatIndex: number,
  timer: number,
  tableId: string,
  isValidDeclared: boolean,
  massage: string,
  startDeclarTimerUser: any[],
  openDeck: string[];
  totalPoints: number;
}

export interface formatScoreBoardInfoIf {
  tableId: string,
  timer: number,
  message: string
  trumpCard: string[],
  isSplitAmount: boolean;
  scoreBoradTable: UserInfoIf[],
  isLastDeal: boolean;
  isLeaveBtn: boolean;
}

export interface formatLostEventInfoIf {
  tableId: string,
  userId: string,
  seatIndex: number,
}
export interface formatLeaveTableInfoIf {
  tableId: string;
  userId: string;
  seatIndex: number;
  currentRound: number;
  tableState: string;
  updatedUserCount: number;
  message: string;
  winPrize: number;
  isLeaveBeforeLockIn: boolean;
}


export interface formatWinnerInfoIf {
  tableId: string,
  userId: string,
  seatIndex: number,
  winAmount: number,
  balance: number
}

export interface formatViewScoreBoardInfoif {
  tableId: string,
  trumpCard: string[],
  scoreBoradTable: UserInfoIf[],
}

export interface formatRoundstartInfoIf {
  tableId: string,
  // currentRound: number,
  timer: number,
  msg: string,
}
export interface formatWaitingPlayersInfoIf {
  tableId: string,
  currentRound: number,
  timer: number,
  msg: string,
}

export interface cardsIf {
  group?: Array<string>;
  groupType?: string;
  cardPoints?: number
}

export interface finishTimerStartPlayerDetailIf {
  userId?: string,
  seatIndex?: number,
}

export interface popupDataIf {
  msg: string;
  title: string;
}

export interface formatRejoinInfoIf {
  tableId: string;
  isDeclareTimerStart: boolean;
  isScoreBoard: boolean;
  isSplit: boolean;
  isResultSplit: boolean;
  isShowPopup: boolean;
  timer: number;
  isSecondaryTurn: boolean;
  isSeconderyTurnsRemain: boolean;
  userTotalTurnTimer: number;
  message: string;
  popupData: popupDataIf,
  balance: number;
  bootAmount: number;
  currentRound: number;
  winPrice: number;
  tableState: string;
  totalPoints: number;
  currentTurnSeatIndex: number;
  currentTurnUserId: string;
  dealerIndex: number;
  chips: number;
  selfPlayerDetails: playarDetail;
  trumpCard: string[];
  finishDeck: string[];
  playersDetails: userSeatKeyIf[];
  finishTimerStartPlayerDetail: finishTimerStartPlayerDetailIf;
  otherPlayerDeclares: otherPlayersIf[],
  scoreBord: formatScoreBoardInfoIf;
  splitDetails: playersSplitAmountDetailsIf[];
  cards: cards[];
  opendDeck: string[];
  cardCounts: number;
}

export interface rejoinDataIf {
  isTurnStart: boolean;
  isLockInperiod: boolean;
  isFinishTimerStart: boolean;
  isDeclareTimerStart: boolean;
  isDisplayScoreBoard: boolean;
  isAutoSplit: boolean;
  timer: number,
  balance: number
}

export interface formatPlayerSplitAmountDetailsIf {
  tableId: string;
  message: string;
  title: string;
  timer: number;
  playersSplitAmountDetails: playersSplitAmountDetailsIf[];
}

export interface formatSplitDeclareInfoIf {
  tableId: string;
  playerDetails: splitAmountDeclareIf[]
}

export interface formatNextRoundStartInfoIf {
  tableId: string;
  timer: number;
  message: string;
}

export interface formatShowOpenDeckCardsInfoIf {
  tableId: string,
  opendDeck: string[]
}

export interface formatScoreboardTimerAndSplitInfoIf {
  timer: number;
  message: string;
  isSplit: boolean;
  splitUsers: splitPlayerDataIf[];
  isLeaveBtn: boolean;
}



export interface ackTableDataIF {
  tableId: string;
  minimumSeat: number;
  maximumSeat: number;
  gameType: string;
  seatIndex: number;
  activePlayers: number;
  gameStartTimer: number;
  turnTimer: number;
  tableState: string;
  closedDeck: string[];
  opendDeck: string[];
  turnCount: number;
  dealerPlayer: number;
  declareingPlayer: string;
  validDeclaredPlayer: string;
  validDeclaredPlayerSI: number;
  playersDetail: userSeatKeyIf[];
  playersCount: number;
}

interface signupResponseIF {
  _id: string;
  un: string;
  pp: string;
  socketid: string;
  tableId: string;
  gameId: string;
  lobbyId: string;
  isFTUE: boolean;
  chips: number;
  isPlay: boolean;
  fromBack: boolean;
  isRobot: boolean;
  dealType: number;
  gamePoolType: number;
  latitude: string;
  longitude: string;
  entryFee: number
  maximumSeat: number,
  maxTableCreateLimit: number,
  rummyType : string;
  authToken: string;
}

export interface formatSignupAckIf {
  signupResponse: signupResponseIF;
  gameTableInfoData: ackTableDataIF[];
  reconnect: boolean;
}


export interface formatSettingMenuTableInfo {
  tableId: string;
  gameType: string;
  variant: string;
  numberOfDeck: number;
  printedJoker: string;
  printedValue: number;
  drop: dropIF;
}

export interface formatScoreCardInfoIf {
  title: string[];
  roundScore: (string | number)[][];
  totalScore: (string | number)[];
  rows: number;
}