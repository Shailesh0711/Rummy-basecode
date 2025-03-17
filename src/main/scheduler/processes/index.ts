import waitingForPlayerProcess from "./waitingForPlayer.process";
import initializeGameplayProcess from "./initializeGameplay.process"
import bootAmountCollectProcess from "./bootAmountCollect.process";
import distributeCardsProcess from "./distributeCards.process";
import startTurnTimerProcess from "./startTurnTimer.process";
import reShuffleCardProcess from "./reShuffleCard.process";
import startFinishTimerProcess from "./startFinishTimer.process";
import remainPlayersdeclarTimerProcess from "./remainPlayerDeclares.process";
import scoreBoardTimerProcess from "./scoreBoardTimer.process"
import leaveTableTimerProcess from "./leaveTableTimer.process";
import lockInPeriodTimerProcess from "./lockInPeriodTimer.procees";
import splitAmountTimerProcess from "./splitAmountTimer.process"
import nextRoundTimerProcess from "./nextRoundTimer.process";
import autoSplitTimerProcess from "./autoSplitTimer.process";
import secondaryTimerProcess from "./secondaryTimer.process";
import ScoreBoardLeaveDelayTimerProcess from "./scoreBoardLeaveDelay.process";
import rejoinGamePopupProcess from "./rejoinGamePopup.process";

const exportObject = {
    waitingForPlayerProcess,
    initializeGameplayProcess,
    bootAmountCollectProcess,
    distributeCardsProcess,
    startTurnTimerProcess,
    reShuffleCardProcess,
    startFinishTimerProcess,
    remainPlayersdeclarTimerProcess,
    scoreBoardTimerProcess,
    leaveTableTimerProcess,
    lockInPeriodTimerProcess,
    splitAmountTimerProcess,
    nextRoundTimerProcess,
    autoSplitTimerProcess,
    secondaryTimerProcess,
    ScoreBoardLeaveDelayTimerProcess,
    rejoinGamePopupProcess,
}

export = exportObject