import { roundTableIf, userSeatKeyIF, userSeatKeyIf } from "../../interfaces/roundTableIf";
import Errors from "../../errors";
import { finishTimerStartPlayerDetailIf, formatRejoinInfoIf, formatScoreBoardInfoIf, popupDataIf, rejoinDataIf } from "../../interfaces/responseIf";
import logger from "../../../logger";
import { responseValidator } from "../../validator";
import { playerPlayingDataIf } from "../../interfaces/playerPlayingTableIf";
import { playingTableIf } from "../../interfaces/playingTableIf";
import { MESSAGES, NULL, NUMERICAL, PLAYER_STATE, RUMMY_TYPES, SPLIT_STATE, TABLE_STATE } from "../../../constants";
import checkCardSequence from "../play/cards/checkCardSequence";
import formatScoreBoardInfo from "./formatScoreBoardInfo";
import { UserInfoIf, splitPlayerDataIf } from "../../interfaces/scoreBoardIf";
import { otherPlayersIf } from "../../interfaces/schedulerIf";
import { getPlayerGamePlay } from "../cache/Players";
import { playersSplitAmountDetailsIf } from "../../interfaces/splitAmount";
import { cards } from "../../interfaces/cards";
import config from "../../../connections/config";
import countUserCards from "../utils/countUserCards";
import { emetyTableSeats } from "../utils/emetyTableSeat";
import timeDifference from "../../common/timeDiff";
import dealRummyScoreBoadPlayerInfo from "../play/scoreBoard/helper/dealRummyScoreBoadPlayerInfo";
import { dealRummyCheckFinalWinerInScoreBoard } from "../play/scoreBoard/helper/dealRummyCheckFinalWinerInScoreBoard";
import poolRummyScoreBoadPlayerInfo from "../play/scoreBoard/helper/poolRummyScoreBoadPlayerInfo";
import { poolRummyCheckFinalWinerInScoreBoard } from "../play/scoreBoard/helper/poolRummyCheckFinalWinerInScoreBoard";
import { pointRummyScoreBoadPlayerInfo } from "../play/scoreBoard/helper/pointRummyScoreBoadPlayerInfo";
import { getScoreBoardHistory } from "../cache/ScoreBoardHistory";


async function formatRejoinInfo(
    playerData: playerPlayingDataIf,
    roundTableData: roundTableIf,
    tableData: playingTableIf,
    data: rejoinDataIf
): Promise<formatRejoinInfoIf> {
    const { DEAL_NEW_GAME_TIMER, POINT_RUMMY_SCORE_BOARD_TIMER, DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER, TURN_TIMER, SECONDARY_TIMER, NEW_GAME_START_TIMER, SCORE_BOARD_TIMER, REJOINT_GAME_POPUP_TIMER } = config();
    try {
        logger.info("------>> formatRejoinInfo :: RUMMY_TYPE :: ", tableData.rummyType);
        // player cards 
        let card: cards[] = [];
        let cardCounts: number = NUMERICAL.ZERO;
        if (
            roundTableData.tableState !== TABLE_STATE.ROUND_TIMER_STARTED &&
            roundTableData.tableState !== TABLE_STATE.WAITING_FOR_PLAYERS &&
            roundTableData.tableState !== TABLE_STATE.WAIT_FOR_PLAYER &&
            roundTableData.tableState !== TABLE_STATE.COLLECTING_BOOT_VALUE &&
            roundTableData.tableState !== TABLE_STATE.LOCK_IN_PERIOD &&
            roundTableData.tableState !== TABLE_STATE.TOSS_CARDS &&
            roundTableData.tableState !== TABLE_STATE.NEXT_ROUND_START
        ) {
            card = await checkCardSequence(playerData.currentCards, playerData, roundTableData.tableId);
            cardCounts = await countUserCards(playerData.currentCards);
        }

        // seat players details
        let seatsObj: Array<userSeatKeyIF> = []
        let validDeclaredPlayerUserName: string = "";
        for await (const key of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[key]).length > 0) {
                const playerInfo = await getPlayerGamePlay(roundTableData.seats[key].userId, tableData._id);
                logger.info(`------>> formatRejoinInfo :: playerInfo :: `, playerInfo);

                let gameScore: number = NUMERICAL.ZERO
                if (tableData.rummyType === RUMMY_TYPES.DEALS_RUMMY) {
                    gameScore = playerInfo && playerInfo.gamePoints ? (playerInfo.gamePoints + playerInfo.roundLostPoint) : NUMERICAL.ZERO;
                } else if (tableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {
                    gameScore = playerInfo && playerInfo.gamePoints ? (playerInfo.gamePoints - playerInfo.roundLostPoint) : NUMERICAL.ZERO;
                } else if (tableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
                    gameScore = playerData && playerInfo.gamePoints ? playerInfo.gamePoints : NUMERICAL.ZERO
                }

                const obj: userSeatKeyIF = {
                    _id: roundTableData.seats[key]._id,
                    userId: roundTableData.seats[key].userId,
                    username: roundTableData.seats[key].username,
                    profilePicture: roundTableData.seats[key].profilePicture,
                    seatIndex: roundTableData.seats[key].seatIndex,
                    userStatus: roundTableData.seats[key].userStatus,
                    inGame: roundTableData.seats[key].inGame,
                    gameScore: gameScore,
                } as userSeatKeyIF;
                seatsObj.push(obj);
            }
            if (roundTableData.validDeclaredPlayer !== "") {
                if (roundTableData.seats[key].userId === roundTableData.validDeclaredPlayer) {
                    validDeclaredPlayerUserName = roundTableData.seats[key].username
                }
            }
        }

        if (
            (roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS ||
                roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER ||
                roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED ||
                roundTableData.tableState === TABLE_STATE.LOCK_IN_PERIOD) ||
            tableData.rummyType === RUMMY_TYPES.POINT_RUMMY
        ) {
            seatsObj = await emetyTableSeats(seatsObj);
        }
        logger.info('------>> formatRejoinInfo :: seatsObj :>> ', seatsObj);

        // current turn user Index
        let currentTurnSeatIndex: number = NUMERICAL.MINUS_ONE;
        let currentTurnUserId: string = "";
        if (data.isTurnStart) {

            if (roundTableData.currentTurn !== NULL) {
                for await (const key of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[key]).length > 0) {
                        if (roundTableData.seats[key].userId === roundTableData.currentTurn) {
                            currentTurnSeatIndex = roundTableData.seats[key].seatIndex
                            currentTurnUserId = roundTableData.seats[key].userId;
                        }
                    }
                }
            }
        }
        let isSeconderyTurnsRemain = (playerData.remainSecondryTime > NUMERICAL.ZERO) ? true : false;
        if (roundTableData.currentTurn !== playerData.userId) {
            const turnPlayData = await getPlayerGamePlay(roundTableData.currentTurn, tableData._id)
            if (turnPlayData) {
                isSeconderyTurnsRemain = (turnPlayData.remainSecondryTime > NUMERICAL.ZERO) ? true : false;
            }
        }

        // dealer Index
        let dealerIndex: number = NUMERICAL.MINUS_ONE;
        for await (const seat of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[seat]).length > 0) {
                if (roundTableData.seats[seat].userId === roundTableData.dealerPlayer) {
                    dealerIndex = roundTableData.seats[seat].seatIndex
                }
            }
        }

        // message is table state is ROUND_TIMER_START
        let message: string = ``

        if (roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER) {
            message = MESSAGES.POPUP.CENTER_TOAST_POPUP.WAIT_PLAYER_POPUP_MESSAGE;
        }

        if (roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED) {
            message = `Game begins in 0 seconds`
        }

        if (roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS) {
            message = `Waiting For Another Player till 0 Seconds`
        }

        // message is table state is LOCK_IN_PERIOD
        let popupData: popupDataIf = {} as popupDataIf;
        popupData.title = "";
        let isShowPopup = false;
        if (roundTableData.tableState === TABLE_STATE.LOCK_IN_PERIOD) {
            popupData = {
                msg: MESSAGES.MESSAGE.LOCK_IN_PERIOD,
                title: "",
            }
            message = `Game begins in 0 seconds`
        }

        if (
            roundTableData.tableState === TABLE_STATE.ROUND_OVER &&
            playerData.playingStatus === PLAYER_STATE.DECLARED &&
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus === PLAYER_STATE.PLAYING
        ) {
            popupData.msg = `${MESSAGES.POPUP.MIDDLE_TOAST_POP.PLAYER} ${validDeclaredPlayerUserName} ${MESSAGES.POPUP.MIDDLE_TOAST_POP.OTHER_FOR_VAILD_SEQUENCE_AND_DECLARE}`
            isShowPopup = true;
        }

        if (
            (
                roundTableData.tableState === TABLE_STATE.TURN_STARTED ||
                roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START
            ) &&
            roundTableData.seats[`s${playerData.seatIndex}`].userStatus === PLAYER_STATE.WRONG_DECLARED
        ) {
            popupData.msg = MESSAGES.POPUP.CENTER_TOAST_POPUP.INVALAID_DECLARE_POPUP_MESSAGE
            isShowPopup = true;
        }

        if (roundTableData.tableState === TABLE_STATE.FINISH_TIMER_START && playerData.isTurn) {
            popupData.msg = MESSAGES.POPUP.MIDDLE_TOAST_POP.FOR_VAILD_SEQUENCE_AND_DECLARE
            isShowPopup = true;
        }

        // if  finishing timer start
        let finishTimerStartPlayerInfo: finishTimerStartPlayerDetailIf = {} as finishTimerStartPlayerDetailIf
        if (data.isFinishTimerStart) {
            if (roundTableData.finishTimerStartPlayerId !== NULL) {
                const userId = roundTableData.finishTimerStartPlayerId;

                let finishPlayerIndex = NUMERICAL.MINUS_ONE;

                for await (const key of Object.keys(roundTableData.seats)) {
                    if (Object.keys(roundTableData.seats[key]).length > 0) {
                        if (roundTableData.seats[key].userId === userId) {
                            finishPlayerIndex = roundTableData.seats[key].seatIndex
                        }
                    }
                }

                finishTimerStartPlayerInfo = {
                    userId: roundTableData.finishTimerStartPlayerId,
                    seatIndex: finishPlayerIndex
                }
                currentTurnSeatIndex = finishTimerStartPlayerInfo.seatIndex as number;
                currentTurnUserId = finishTimerStartPlayerInfo.userId as string;
            }
        }

        // if valid declared than
        let otherPlayerDeclares: otherPlayersIf[] = [];
        let formatedScoreBoardRes: formatScoreBoardInfoIf = {} as formatScoreBoardInfoIf;
        let isDeclared = false;
        let isScoreboard = false;

        if (data.isDeclareTimerStart) {
            let declared = false;

            for await (const key of Object.keys(roundTableData.seats)) {
                if (Object.keys(roundTableData.seats[key]).length > 0) {
                    if (roundTableData.seats[key].userId === playerData.userId) {

                        if (roundTableData.seats[key].userStatus !== PLAYER_STATE.PLAYING) {
                            declared = true;
                        } else if (
                            roundTableData.seats[key].userStatus === PLAYER_STATE.PLAYING &&
                            roundTableData.seats[key].userStatus !== PLAYER_STATE.WATCHING
                        ) {
                            isDeclared = true;
                            const obj = {
                                userId: roundTableData.seats[key].userId,
                                seatIndex: roundTableData.seats[key].seatIndex,
                            }
                            otherPlayerDeclares.push(obj);
                        }

                    } else if (
                        roundTableData.seats[key].userStatus === PLAYER_STATE.PLAYING
                    ) {
                        const obj = {
                            userId: roundTableData.seats[key].userId,
                            seatIndex: roundTableData.seats[key].seatIndex,
                        }
                        otherPlayerDeclares.push(obj);
                    }
                }
            }

            if (declared) {
                otherPlayerDeclares = [];
                isScoreboard = true;
                declared = false;
                isDeclared = false;
                let isLeaveBtn = false;

                let msg = MESSAGES.MESSAGE.OTHER_PLAYER_DECLARING_MESSAGE;
                let playersInfo: UserInfoIf[] = [];
                if (tableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {
                    playersInfo = await poolRummyScoreBoadPlayerInfo(roundTableData.tableId, roundTableData);
                } else if (tableData.rummyType === RUMMY_TYPES.DEALS_RUMMY) {
                    playersInfo = await dealRummyScoreBoadPlayerInfo(roundTableData.tableId, roundTableData);
                } else if (tableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
                    playersInfo = await pointRummyScoreBoadPlayerInfo(roundTableData.tableId, roundTableData)
                }

                formatedScoreBoardRes = await formatScoreBoardInfo(
                    roundTableData.tableId,
                    data.timer,
                    [roundTableData.trumpCard],
                    playersInfo,
                    false,
                    msg,
                    isLeaveBtn
                );
            }
        }

        let isResultSplit = false;
        let isSplit = false;
        let manualSplit = false;
        let playersSplitDetails: playersSplitAmountDetailsIf[] = [];

        // if table state is displayScoreBoard
        if (data.isDisplayScoreBoard) {

            // pool rummy scoreBoard Data
            if (tableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {

                isScoreboard = true;
                let msg = `Next round start in 0 seconds`;
                let playersInfo: UserInfoIf[] = await poolRummyScoreBoadPlayerInfo(roundTableData.tableId, roundTableData);
                const finalWinner = await poolRummyCheckFinalWinerInScoreBoard(playersInfo);
                let currentPlayerScoreBoardData = {} as UserInfoIf;

                let splitPlayerData: splitPlayerDataIf[] = [];

                for await (const playerInfo of playersInfo) {
                    if (playerInfo.tableId === roundTableData.tableId) {

                        if (playerInfo.userId === playerData.userId) {
                            currentPlayerScoreBoardData = playerInfo;
                        }

                        if (roundTableData.isEligibleForSplit) {
                            if (
                                playerInfo.message !== MESSAGES.MESSAGE.Eliminated &&
                                playerInfo.Status !== PLAYER_STATE.LOST &&
                                playerInfo.Status !== PLAYER_STATE.LEFT
                            ) {
                                splitPlayerData.push({
                                    userId: playerInfo.userId,
                                    seatIndex: playerInfo.seatIndex
                                });

                                if (playerInfo.userId === playerData.userId) {
                                    manualSplit = true;
                                }
                            }
                        }
                    }
                }

                formatedScoreBoardRes = await formatScoreBoardInfo(
                    roundTableData.tableId,
                    data.timer,
                    [roundTableData.trumpCard],
                    playersInfo,
                    manualSplit,
                    msg,
                    false
                );

                logger.info(`------>> formatRejoinInfo :: finalWinner :: `, finalWinner)
                logger.info(`------>> formatRejoinInfo :: formatedScoreBoardRes :: `, formatedScoreBoardRes)

                let scoreBoardIdex: number = NUMERICAL.ZERO;
                for await (const playerScoreboardDetail of formatedScoreBoardRes.scoreBoradTable) {
                    if (playerScoreboardDetail.message === MESSAGES.MESSAGE.Eliminated || playerScoreboardDetail.message === MESSAGES.MESSAGE.REJOIN_AGAIN_GAME) {
                        formatedScoreBoardRes.scoreBoradTable[scoreBoardIdex].Status = PLAYER_STATE.ELIMINATED;
                    }
                    if (finalWinner.isFinalWinner && playerScoreboardDetail.Status === PLAYER_STATE.WIN_ROUND) {
                        formatedScoreBoardRes.scoreBoradTable[scoreBoardIdex].Status = PLAYER_STATE.WIN;
                    }
                    if (roundTableData.isAutoSplit) {
                        formatedScoreBoardRes.message = MESSAGES.MESSAGE.SCORE_BOARD_AUTO_SPLIT_MESSAGE
                    }

                    scoreBoardIdex += NUMERICAL.ONE;
                }

                formatedScoreBoardRes.message = currentPlayerScoreBoardData.message === MESSAGES.MESSAGE.Eliminated ? `${MESSAGES.MESSAGE.DEAL} ${tableData.currentRound} ${MESSAGES.MESSAGE.SCORE_BOARD_ELIMINATED_PLAYER_MESSAGE}` : formatedScoreBoardRes.message;
                formatedScoreBoardRes.message = finalWinner.isFinalWinner && currentPlayerScoreBoardData.Status === PLAYER_STATE.WIN ? `${MESSAGES.MESSAGE.SCORE_BOARD_WINNER_MESSAGE}${finalWinner.winAmount}!` : formatedScoreBoardRes.message;
                formatedScoreBoardRes.timer = currentPlayerScoreBoardData.message === MESSAGES.MESSAGE.Eliminated ? NUMERICAL.MINUS_ONE : data.timer;
                formatedScoreBoardRes.timer = (finalWinner.isFinalWinner && currentPlayerScoreBoardData.Status === PLAYER_STATE.WIN) || roundTableData.isAutoSplit ? NUMERICAL.MINUS_ONE : formatedScoreBoardRes.timer;

                if (roundTableData.isWaitingForRejoinPlayer) {

                    formatedScoreBoardRes.message = !finalWinner.isFinalWinner ?
                        MESSAGES.MESSAGE.WAITING_FOR_PLAYER_REJOIN_MESSAGE : formatedScoreBoardRes.message;

                    formatedScoreBoardRes.message = currentPlayerScoreBoardData.message === MESSAGES.MESSAGE.Eliminated ?
                        MESSAGES.MESSAGE.REJOIN_GAME_PLAYER_SCORE_BOARD_MESSAGE : formatedScoreBoardRes.message;

                    const rejoinGamePlayerData = await getPlayerGamePlay(roundTableData.eliminatedPlayers[NUMERICAL.ZERO], tableData._id);

                    const timeDiff: number = timeDifference(new Date(), rejoinGamePlayerData.updatedAt, REJOINT_GAME_POPUP_TIMER);

                    formatedScoreBoardRes.timer = !finalWinner.isFinalWinner ? timeDiff : formatedScoreBoardRes.timer;

                    formatedScoreBoardRes.timer = currentPlayerScoreBoardData.message === MESSAGES.MESSAGE.Eliminated ? NUMERICAL.MINUS_ONE : formatedScoreBoardRes.timer;

                }

                if (manualSplit && !roundTableData.isWaitingForRejoinPlayer) {


                    popupData.msg = MESSAGES.MESSAGE.MANUAL_SPLIT_CONFIRM_MESSAGE

                    if (roundTableData.isSplit) {
                        isSplit = true;
                        const splitPlayersStatus: string[] = [];
                        for await (const player of splitPlayerData) {
                            const playerInfo = await getPlayerGamePlay(player.userId, tableData._id)
                            splitPlayersStatus.push(playerInfo.splitDetails.splitStatus)
                            if (
                                playerInfo.splitDetails.splitStatus === SPLIT_STATE.YES ||
                                playerInfo.splitDetails.splitStatus === SPLIT_STATE.NO
                            ) {
                                if (playerData.userId === playerInfo.userId) {
                                    isResultSplit = true;
                                    popupData.msg = MESSAGES.MESSAGE.MANUAL_SPLIT_SINGLE_PLAYER_ACCEPED
                                    popupData.title = `${MESSAGES.MESSAGE.SPLIT_EVENT_MESSAGE}${playerInfo.splitDetails.amount}`
                                }
                            }

                            const obj = {
                                userId: playerInfo.userId,
                                amount: playerInfo.splitDetails.amount,
                                splitStatus: playerInfo.splitDetails.splitStatus,
                                remainDrops: playerInfo.splitDetails.drop,
                                socketId: playerInfo.socketId,
                                userName: playerInfo.username,
                                gameScore: playerInfo.gamePoints
                            }
                            playersSplitDetails.push(obj);
                        }

                        const allEqual = splitPlayersStatus.every((val) => val === SPLIT_STATE.YES);
                        const isSplitStateIncludePedding = splitPlayersStatus.includes(SPLIT_STATE.PENDING);
                        popupData.msg = allEqual ?
                            `${MESSAGES.MESSAGE.SPLIT_WIN_MESSAGE}${playerData.splitDetails.amount}!` : playerData.splitDetails.splitStatus === SPLIT_STATE.NO ?
                                MESSAGES.MESSAGE.MANUAL_SPLIT_REJECT_MESSAGE : !isSplitStateIncludePedding ?
                                    MESSAGES.MESSAGE.MANUAL_SPLIT_NOT_AGREE_MESSAGE : popupData.msg;

                        data.timer = (allEqual || !isSplitStateIncludePedding) ?
                            timeDifference(new Date(), roundTableData.updatedAt, DELAY_FOR_AUTO_SPLIT_IN_SCORE_BOARD_TIMER) : data.timer;
                    }
                }
            }
            // deal rummy scoreBoard Data
            else if (tableData.rummyType === RUMMY_TYPES.DEALS_RUMMY) {
                isScoreboard = true;
                const scoreBoardData = await getScoreBoardHistory(roundTableData.tableId);
                logger.info("------ formatRejoinInfo :: scoreBoardData[`${roundTableData.tableId}`] : ", scoreBoardData[`Round${tableData.currentRound}`]);

                if (scoreBoardData && scoreBoardData.hasOwnProperty(`Round${tableData.currentRound}`) && 'tableId' in scoreBoardData[`Round${tableData.currentRound}`]) {

                    logger.info("------ formatRejoinInfo :: HISTORY :: ")
                    formatedScoreBoardRes = scoreBoardData[`Round${tableData.currentRound}`];

                    if (tableData.dealType === tableData.currentRound || roundTableData.totalPlayers === NUMERICAL.ONE) {
                        formatedScoreBoardRes.message = `new game start in 0 seconds`;
                        data.timer = timeDifference(new Date(), roundTableData.updatedAt, DEAL_NEW_GAME_TIMER);
                        formatedScoreBoardRes.isLeaveBtn = true;
                    }

                    formatedScoreBoardRes.timer = data.timer;

                } else {

                    isScoreboard = true;
                    let msg = `Next round start in 0 seconds`;
                    let playersInfo: UserInfoIf[] = await dealRummyScoreBoadPlayerInfo(roundTableData.tableId, roundTableData);
                    let isLeaveBtn = false;

                    if (tableData.dealType === tableData.currentRound || roundTableData.totalPlayers === NUMERICAL.ONE) {
                        msg = `new game start in 0 seconds`;
                        data.timer = timeDifference(new Date(), roundTableData.updatedAt, DEAL_NEW_GAME_TIMER);
                        isLeaveBtn = true;
                    }

                    formatedScoreBoardRes = await formatScoreBoardInfo(
                        roundTableData.tableId,
                        data.timer,
                        [roundTableData.trumpCard],
                        playersInfo,
                        manualSplit,
                        msg,
                        isLeaveBtn
                    );

                    const finalWinner = await dealRummyCheckFinalWinerInScoreBoard(playersInfo, tableData.currentRound);
                    let playerCount: number = NUMERICAL.ZERO;

                    for await (const player of formatedScoreBoardRes.scoreBoradTable) {
                        if (finalWinner.isMultiWinner) {
                            for await (const drawnPlayer of finalWinner.mulltiWinnerPlayerData) {
                                if (drawnPlayer.userId === player.userId) {
                                    formatedScoreBoardRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.DRAW;
                                    // formatedScoreBoardRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                                }
                            }
                        }

                        if (finalWinner.isFinalWinner && formatedScoreBoardRes.scoreBoradTable[playerCount].Status === PLAYER_STATE.WIN_ROUND) {
                            if (player.userId !== finalWinner.winnerPlayerData.userId) {
                                formatedScoreBoardRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.LOST;
                            }
                        }

                        if (finalWinner.isFinalWinner && player.userId === finalWinner.winnerPlayerData.userId) {
                            formatedScoreBoardRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                        }

                        if (finalWinner.isFinalWinner && player.Status === PLAYER_STATE.WIN_ROUND && roundTableData.totalPlayers === NUMERICAL.ONE) {
                            formatedScoreBoardRes.scoreBoradTable[playerCount].Status = PLAYER_STATE.WIN;
                        }

                        playerCount += NUMERICAL.ONE;
                    }
                }
            }
            // point rummy scoreBoard Data
            else if (tableData.rummyType === RUMMY_TYPES.POINT_RUMMY) {
                isScoreboard = true;

                data.timer = timeDifference(new Date(), roundTableData.updatedAt, Number(POINT_RUMMY_SCORE_BOARD_TIMER));

                const scoreBoardData = await getScoreBoardHistory(playerData.userId);
                logger.info("------ formatRejoinInfo :: scoreBoardData[`${playerData.userId}`] : ", scoreBoardData[`${playerData.userId}`]);

                if (scoreBoardData && scoreBoardData.hasOwnProperty(`${playerData.userId}`) && 'tableId' in scoreBoardData[`${playerData.userId}`]) {
                    formatedScoreBoardRes = scoreBoardData[`${playerData.userId}`];
                    formatedScoreBoardRes.timer = data.timer;
                    formatedScoreBoardRes.isLeaveBtn = true;
                } else {

                    let msg = `New game start in 0 seconds`;
                    let playersInfo: UserInfoIf[] = await pointRummyScoreBoadPlayerInfo(roundTableData.tableId, roundTableData);
                    let isLeaveBtn = true;

                    formatedScoreBoardRes = await formatScoreBoardInfo(
                        roundTableData.tableId,
                        data.timer,
                        [roundTableData.trumpCard],
                        playersInfo,
                        manualSplit,
                        msg,
                        isLeaveBtn
                    );

                    let playersCount = NUMERICAL.ZERO;
                    let winnerIndex: number = NUMERICAL.ZERO;
                    let winAmount: number = NUMERICAL.ZERO;

                    for await (const player of formatedScoreBoardRes.scoreBoradTable) {
                        if (player.Status === PLAYER_STATE.WIN_ROUND) {
                            formatedScoreBoardRes.scoreBoradTable[playersCount].Status = PLAYER_STATE.WIN;
                            winnerIndex = playersCount;
                            // break;
                        } else {
                            winAmount += player.DealScore
                        }
                        playersCount += NUMERICAL.ONE;
                    }

                    formatedScoreBoardRes.scoreBoradTable[winnerIndex].gameScore = formatedScoreBoardRes.scoreBoradTable[winnerIndex].Status === PLAYER_STATE.WIN ?
                        `+ ₹${winAmount * tableData.bootAmount}` : formatedScoreBoardRes.scoreBoradTable[winnerIndex].gameScore;

                }

            }
        }

        // if auto split is enabled
        if (tableData.rummyType === RUMMY_TYPES.POOL_RUMMY) {
            if (data.isAutoSplit) {
                isSplit = true;
                isResultSplit = true;
                isScoreboard = true;
                let msg = MESSAGES.MESSAGE.SCORE_BOARD_AUTO_SPLIT_MESSAGE

                let playersInfo: UserInfoIf[] = await poolRummyScoreBoadPlayerInfo(roundTableData.tableId, roundTableData);
                let splitPlayerData: splitPlayerDataIf[] = [];
                popupData.msg = MESSAGES.MESSAGE.AUTO_SPLIT_MESSAGE;

                for await (const playerInfo of playersInfo) {
                    if (playerInfo.tableId === roundTableData.tableId) {
                        if (roundTableData.isEligibleForSplit) {
                            if (
                                playerInfo.message !== MESSAGES.MESSAGE.Eliminated &&
                                playerInfo.Status !== PLAYER_STATE.LOST &&
                                playerInfo.Status !== PLAYER_STATE.LEFT
                            ) {
                                splitPlayerData.push({
                                    userId: playerInfo.userId,
                                    seatIndex: playerInfo.seatIndex
                                });
                            }
                        }
                    }
                }

                formatedScoreBoardRes = await formatScoreBoardInfo(
                    roundTableData.tableId,
                    NUMERICAL.MINUS_ONE,
                    [roundTableData.trumpCard],
                    playersInfo,
                    false,
                    msg,
                    false
                );

                if (roundTableData.isSplit) {

                    for await (const player of splitPlayerData) {
                        const playerInfo = await getPlayerGamePlay(player.userId, tableData._id);

                        if (playerInfo.splitDetails.splitStatus === SPLIT_STATE.YES) {
                            if (playerInfo.userId === playerData.userId) {
                                popupData.title = `${MESSAGES.MESSAGE.AUTO_SPLIT_EVENT_MESSAGE}${playerInfo.splitDetails.amount}`
                                isResultSplit = true;
                            }

                            const obj = {
                                userId: playerInfo.userId,
                                amount: playerInfo.splitDetails.amount,
                                splitStatus: playerInfo.splitDetails.splitStatus,
                                remainDrops: playerInfo.splitDetails.drop,
                                socketId: playerInfo.socketId,
                                userName: playerInfo.username,
                                gameScore: playerInfo.gamePoints
                            }
                            playersSplitDetails.push(obj);
                        }
                    }
                }
            }
        }

        // for watching player
        if (roundTableData.seats[`s${playerData.seatIndex}`].userId === playerData.userId) {
            if (roundTableData.seats[`s${playerData.seatIndex}`].userStatus === PLAYER_STATE.WATCHING) {
                isShowPopup = true;
                popupData.msg = MESSAGES.POPUP.CENTER_TOAST_POPUP.YOU_ARE_SEAT_IN_WATCHING_MODE_PLEASE_WAITING_FOR_NEW_GAME_START;
            }
        }

        let winPrize: number = (roundTableData.tableState === TABLE_STATE.WAIT_FOR_PLAYER || roundTableData.tableState === TABLE_STATE.WAITING_FOR_PLAYERS || roundTableData.tableState === TABLE_STATE.ROUND_TIMER_STARTED) && tableData.currentRound === NUMERICAL.ONE && (roundTableData.maxPlayers === NUMERICAL.TWO || roundTableData.totalPlayers <= NUMERICAL.TWO) ?
            Number(((NUMERICAL.TWO * tableData.bootAmount) * (NUMERICAL.ONE - (tableData.rake / 100))).toFixed(NUMERICAL.TWO)) : tableData.winPrice;
        logger.info(`------>> formatRejoinInfo :: winPrize :: `, winPrize);

        let Info: formatRejoinInfoIf = {
            tableId: roundTableData.tableId,
            isDeclareTimerStart: isDeclared,
            isScoreBoard: isScoreboard,
            isSplit: isSplit,
            isResultSplit: isResultSplit,
            isShowPopup: isShowPopup,
            timer: data.timer,
            isSecondaryTurn: roundTableData.isSecondaryTurn,
            isSeconderyTurnsRemain: isSeconderyTurnsRemain,
            userTotalTurnTimer: roundTableData.isSecondaryTurn ? SECONDARY_TIMER : TURN_TIMER,
            message: message,
            popupData: popupData,
            balance: data.balance,
            bootAmount: tableData.bootAmount,
            currentRound: tableData.currentRound,
            winPrice: Number(winPrize),
            tableState: roundTableData.tableState,
            totalPoints: playerData.cardPoints,
            currentTurnSeatIndex: currentTurnSeatIndex,
            currentTurnUserId: currentTurnUserId,
            dealerIndex: dealerIndex,
            chips: 0,
            selfPlayerDetails: {
                _id: roundTableData.seats[`s${playerData.seatIndex}`]._id,
                userId: roundTableData.seats[`s${playerData.seatIndex}`].userId,
                username: roundTableData.seats[`s${playerData.seatIndex}`].username,
                profilePicture: roundTableData.seats[`s${playerData.seatIndex}`].profilePicture,
                seatIndex: roundTableData.seats[`s${playerData.seatIndex}`].seatIndex,
                userStatus: roundTableData.seats[`s${playerData.seatIndex}`].userStatus,
            },
            trumpCard: [roundTableData.trumpCard],
            finishDeck: roundTableData.finishDeck,
            playersDetails: seatsObj,
            finishTimerStartPlayerDetail: finishTimerStartPlayerInfo, // done
            otherPlayerDeclares: otherPlayerDeclares,                 // done
            scoreBord: formatedScoreBoardRes,                        // done
            splitDetails: playersSplitDetails,                        // done
            opendDeck: roundTableData.opendDeck,
            cards: card,
            cardCounts: cardCounts
        };

        Info = await responseValidator.formatRejoinInfoValidator(Info);
        return Info;
    } catch (error) {
        console.log(
            'CATCH_ERROR : formatRejoinInfo :: ',
            roundTableData,
            error,
        );
        logger.error(
            'CATCH_ERROR : formatRejoinInfo :: ',
            roundTableData,
            error,
        );
        if (error instanceof Errors.CancelBattle) {
            throw new Errors.CancelBattle(error);
        }
        throw error;
    }
}

export = formatRejoinInfo;