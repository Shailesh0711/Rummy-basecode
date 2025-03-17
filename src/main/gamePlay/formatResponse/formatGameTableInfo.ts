import logger from "../../../logger";
import { playingTableIf } from "../../interfaces/playingTableIf";
import { roundTableIf, userSeatKeyIF, userSeatKeyIf } from "../../interfaces/roundTableIf";
import Errors from "../../errors"
import { formatGameTableInfoIf } from "../../interfaces/responseIf";
import { responseValidator } from "../../validator";
import { NULL, NUMERICAL, RUMMY_TYPES, TABLE_STATE } from "../../../constants";
import { getPlayerGamePlay } from "../cache/Players";
import { emetyTableSeats } from "../utils/emetyTableSeat";
import timeDifference from "../../common/timeDiff";
import config from "../../../connections/config";

const formatGameTableInfo = async (
  tableData: playingTableIf,
  roundTableData: roundTableIf,
  currentRound: number
  // seatIndex: number,
): Promise<formatGameTableInfoIf> => {
  const { SECONDARY_TIMER, TURN_TIMER } = config();
  try {
    // const seats: any = [];

    const tempRoundTableData: roundTableIf = JSON.parse(JSON.stringify(roundTableData));
    // Object.keys(tempRoundTableData.seats).map(async (key) =>
    //   seats.push(tempRoundTableData.seats[key])
    // );

    // tempRoundTableData.seats = seats;
    logger.info('tempRoundTableData :: ', tempRoundTableData);

    let seatsObj: Array<userSeatKeyIF> = []
    let curruntTurnSI: number = NUMERICAL.MINUS_ONE;
    let dealerPlayerIndex: number = NUMERICAL.MINUS_ONE;

    for await (const seat of Object.keys(tempRoundTableData.seats)) {
      if (Object.keys(tempRoundTableData.seats[seat]).length > 0) {
        const playerData = await getPlayerGamePlay(tempRoundTableData.seats[seat].userId, tableData._id)

        tempRoundTableData.seats[seat].gameScore = !playerData ?
          NUMERICAL.ZERO : (tableData.rummyType === RUMMY_TYPES.DEALS_RUMMY || tableData.rummyType === RUMMY_TYPES.POOL_RUMMY) ?
            playerData.gamePoints : tableData.rummyType === RUMMY_TYPES.POINT_RUMMY ?
              playerData.cardPoints : NUMERICAL.ZERO;

        seatsObj.push(tempRoundTableData.seats[seat]);

        if (
          tempRoundTableData.seats[seat].userId === tempRoundTableData.currentTurn &&
          tempRoundTableData.tableState !== TABLE_STATE.WAITING_FOR_PLAYERS &&
          tempRoundTableData.tableState !== TABLE_STATE.WAIT_FOR_PLAYER &&
          tempRoundTableData.tableState !== TABLE_STATE.LOCK_IN_PERIOD &&
          tempRoundTableData.tableState !== TABLE_STATE.COLLECTING_BOOT_VALUE &&
          tempRoundTableData.tableState !== TABLE_STATE.TOSS_CARDS &&
          tempRoundTableData.tableState === TABLE_STATE.TURN_STARTED
        ) {
          curruntTurnSI = tempRoundTableData.seats[seat].seatIndex;
        }

        if (tempRoundTableData.dealerPlayer === tempRoundTableData.seats[seat].userId) {
          dealerPlayerIndex = tempRoundTableData.seats[seat].seatIndex;
        }

      }
    }
    if (currentRound < NUMERICAL.TWO) {
      seatsObj = await emetyTableSeats(seatsObj);
    }

    let winPrice: number = NUMERICAL.ZERO
    if ((tempRoundTableData.maxPlayers === NUMERICAL.TWO || seatsObj.length <= NUMERICAL.TWO) && currentRound === NUMERICAL.ONE) {
      winPrice = (NUMERICAL.TWO * tableData.bootAmount) * (NUMERICAL.ONE - (tableData.rake / 100));
      winPrice = Number(winPrice.toFixed(2));
    } else {
      winPrice = tableData.winPrice
    }

    let isRemainSeconderyTurns: boolean = false;

    if (tempRoundTableData.currentTurn !== NULL) {
      const currentTurnPlayerData = await getPlayerGamePlay(tempRoundTableData.currentTurn, tableData._id);
      if (currentTurnPlayerData) {
        isRemainSeconderyTurns = currentTurnPlayerData.remainSecondryTime > NUMERICAL.ZERO ?
          true : false;
      }
    }

    let remainTime: number = NUMERICAL.MINUS_ONE;
    if (roundTableData.tableState === TABLE_STATE.TURN_STARTED) {
      // turn true
      if (roundTableData.isSecondaryTurn) {
        remainTime = timeDifference(new Date(), roundTableData.updatedAt, SECONDARY_TIMER);
      } else {
        remainTime = timeDifference(new Date(), roundTableData.updatedAt, TURN_TIMER);
      }
    }

    // if (tempRoundTableData.totalDealPlayer > NUMERICAL.TWO) {
    //   winPrice = (tempRoundTableData.totalDealPlayer * tableData.bootAmount) * (1 - (tableData.rake / 100))
    // }

    let resObj: formatGameTableInfoIf = {
      isRejoin: false,
      totalRounds: tableData.totalRounds,
      isFTUE: tableData.isFTUE,
      bootAmount: tableData.bootAmount,
      potValue: tableData.potValue,
      winPrice: winPrice,
      userTurnTimer: tableData.userTurnTimer,
      winningScores: tableData.winningScores,
      roundTableId: tempRoundTableData._id,
      tableId: tempRoundTableData.tableId,
      totalPlayers: tempRoundTableData.totalPlayers,
      maxPlayers: tempRoundTableData.maxPlayers,
      currentRound: currentRound,
      seats: seatsObj,

      opendDeck: tempRoundTableData.opendDeck,
      finishDeck: tempRoundTableData.finishDeck,
      trumpCard: tempRoundTableData.trumpCard === NULL ? [] : [tempRoundTableData.trumpCard],
      closedDeck: tempRoundTableData.closedDeck,

      dealerPlayer: dealerPlayerIndex,
      validDeclaredPlayerSI: tempRoundTableData.validDeclaredPlayerSI,
      validDeclaredPlayer: tempRoundTableData.validDeclaredPlayer,
      currentTurnSeatIndex: curruntTurnSI,
      currentTurn: tempRoundTableData.currentTurn,

      totalTurnTime: tempRoundTableData.isSecondaryTurn ?
        NUMERICAL.FIFTEEN : NUMERICAL.THIRTY,
      timer: remainTime,

      isSeconderyTimer: tempRoundTableData.isSecondaryTurn,
      isRemainSeconderyTurns: isRemainSeconderyTurns,

      tableState: tempRoundTableData.tableState,
    };
    resObj = await responseValidator.formatGameTableInfoValidator(resObj);
    return resObj;
  } catch (error) {
    logger.error(
      'CATCH_ERROR : formatGameTableInfo :: ',
      tableData,
      roundTableData,
      // seatIndex,
      error,
    );
    if (error instanceof Errors.CancelBattle) {
      throw new Errors.CancelBattle(error);
    }
    throw error;
  }
};

export = formatGameTableInfo