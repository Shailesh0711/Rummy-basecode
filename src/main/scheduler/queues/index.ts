import WaitingForPlayer from "./waitingForPlayer.queue"
import InitializeGameplay from "./initializeGameplay.queue"
import BootAmountCollect from "./bootAmountCollect.queue";
import TossCardTimer from "./tossCardTimer.queue"
import DistributeCardsQueue from "./distributeCards.queue"
import startTurnQueue from "./startTurn.queue";
import ReShuffleCardQueue from "./reShuffleCard.queue";
import StartFinishTimerQueue from "./startFinishTimer.queue";
import RemainPlayersdeclarTimerQueue from "./remainPlayersdeclarTimer.queue"
import ScoreBoardTimerQueue from "./scoreBoardTimer.queue";
import LeaveTableTimerQueue from "./leaveTableTimer.queue"
import LockInPeriodTimerQueue from "./lockInPeriodTimer.queue";
import splitAmountTimerQueue from "./splitAmountTimer.queue";
import NextRoundTimerQueue from "./nextRoundTimer.queue";
import AutoSplitTimerQueue from "./autoSplitTimer.queue";
import secondaryTimerQueue from "./secondaryTimer.queue";
import ScoreBoardLeaveDelayQueueTimer from "./scoreBoardLeaveDelay.queue";
import ArrageSeatingQueue from "./arrangeSeating.queue";
import RejoinGamePopupQueue from "./rejoinGamePopup.queue";

const exportObject = {
    WaitingForPlayer,
    InitializeGameplay,
    BootAmountCollect,
    TossCardTimer,
    DistributeCardsQueue,
    startTurnQueue,
    ReShuffleCardQueue,
    StartFinishTimerQueue,
    RemainPlayersdeclarTimerQueue,
    ScoreBoardTimerQueue,
    LeaveTableTimerQueue,
    LockInPeriodTimerQueue,
    splitAmountTimerQueue,
    NextRoundTimerQueue,
    AutoSplitTimerQueue,
    secondaryTimerQueue,
    ScoreBoardLeaveDelayQueueTimer,
    ArrageSeatingQueue,
    RejoinGamePopupQueue,
}

export = exportObject