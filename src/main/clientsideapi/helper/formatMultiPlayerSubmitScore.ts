// import logger from '../../logger';
// import { NUMERICAL } from '../../../constants';
// import { getPlayerGamePlay, getTableData } from '../../gameTable/utils'
// import { userScoreIf, winnLossAmountIf } from '../../interface/userScoreIf'
// import showScoreBoardWinningAmount from '../../play/helpers/scoreOfRound/showScoreBordWinningAmount';
// import { formateScoreIf, multiPlayerWinnScoreIf } from '../../interface/cmgApiIf';

// async function formatMultiPlayerScore(tableId: string, userScore: userScoreIf[], winner: Array<number>, isUserLeft: boolean) : Promise<multiPlayerWinnScoreIf | boolean>  {

//   try {

//     logger.info(tableId, 'userScore :>> ', userScore, winner);
//     const tableData = await getTableData(tableId)
//     const tournamentId = tableData.lobbyId;

//     let playersScore = <formateScoreIf[]>[];
//     let respTest = <winnLossAmountIf[]>[];

//     if (isUserLeft) {
//       logger.info(tableId, 'isUserLeft :>> ', isUserLeft);

//       const playersPlayingData = await Promise.all(
//         userScore.map(async (ele) =>
//           getPlayerGamePlay(ele.userId, tableId),
//         ),
//       );

//       for (let i = 0; i < playersPlayingData.length; i++) {
//         const player = playersPlayingData[i];
//         const tempObj: any = {}
//         if (player.isLeft == false && winner[0] == player.seatIndex) {
//           userScore.map((el) => {
//             if (player.userId == el.userId)
//               tempObj.score = el.totalPoint;
//           })
//           tempObj.userId = player.userId
//           tempObj.winningAmount = tableData.winningAmount
//           tempObj.rank = `${NUMERICAL.ONE}`
//           tempObj.winLossStatus = 'Win'
//           playersScore.push(tempObj);
//         }  
//       }

//       let otherUserRank = NUMERICAL.TWO;
//       for (let i = 0; i < playersPlayingData.length; i++) {
//         const element = playersPlayingData[i];
//         const tempObj: any = {}
//         if (playersScore[0].userId !== element.userId) {
//           userScore.map((el) => {
//             if (element.userId == el.userId)
//               tempObj.score = el.totalPoint;
//           })
//           tempObj.userId = element.userId
//           tempObj.winningAmount = tableData.winningAmount
//           tempObj.rank = `${otherUserRank}`
//           tempObj.winLossStatus = 'Loss'
//           playersScore.push(tempObj);
//           otherUserRank++;
//         }
//       }
//       logger.info(tableId, 'isUserLeft :>> ', isUserLeft, 'playersScore :>> ', playersScore);

//       const resObj = {
//         tableId,
//         tournamentId,
//         playersScore
//       }
//       return resObj;

//     }

//     if (winner.length == NUMERICAL.ONE) {
//       respTest = await showScoreBoardWinningAmount(userScore, winner, tableId) as winnLossAmountIf[];
//     }

//     for (let i = 0; i < userScore.length; i++) {
//       const element : userScoreIf = userScore[i];
//       let matchUserId: string = `-${NUMERICAL.ONE}`;
//       respTest.find(function (data: winnLossAmountIf) {
//         if (data.userId == element.userId) {
//           matchUserId = data.winningAmount as string;
//         }
//       });

//       playersScore.push({
//         userId: element.userId,
//         score: element.totalPoint,
//         winningAmount: matchUserId,
//       });
      
//     }
//     // userScore.forEach((element: userScoreIf) => {
//     //   let matchUserId: string = `-${NUMERICAL.ONE}`;
//     //   respTest.find(function (data: winnLossAmountIf) {
//     //     if (data.userId == element.userId) {
//     //       matchUserId = data.winningAmount as string;
//     //     }
//     //   });

//     //   playersScore.push({
//     //     userId: element.userId,
//     //     score: element.totalPoint,
//     //     winningAmount: matchUserId,
//     //   });
//     // })
    
//     playersScore.sort((a: formateScoreIf, b: formateScoreIf) => {
//       return Number(b.score) - Number(a.score);
//     });

//     logger.info(tableId, "playersScore  before 1 =>> ", playersScore);

//     for (let i = 0; i < playersScore.length; i++) {
//       playersScore[i].rank = `${i + 1}`
//     }

//     // playersScore = playersScore.filter((a: { score: number; }, i: number, x: formateScoreIf[]) => x.findIndex((t: { score: number; }) => t.score === a.score) === i)
//     //   .reduce((arr: formateScoreIf[], item, index: number) => {
//     //     item.rank = JSON.stringify(index + NUMERICAL.ONE);
//     //     arr.push(item);
//     //     return arr as formateScoreIf[];
//     //   }, [])

//     logger.info(tableId, "playersScore  after 1 =>> ", playersScore);

//     for (let i = 0; i < playersScore.length; i++) {
//       const element = playersScore[i];
//       if (element.rank === NUMERICAL.ONE.toString()) {
//         playersScore[i].winLossStatus = "Win";
//       } else {
//         playersScore[i].winLossStatus = "Loss";
//       }
//     }

//     // playersScore.forEach((element: { [x: string]: string; rank: string; }) => {
//     //   if (element.rank === NUMERICAL.ONE.toString()) {
//     //     element["winLossStatus"] = "Win"
//     //   } else {
//     //     element["winLossStatus"] = "Loss"
//     //   }
//     //   return element;
//     // })
//     logger.info(tableId, 'playersScore :==>>> ', playersScore);

//     const resObj : multiPlayerWinnScoreIf = {
//       tableId,
//       tournamentId,
//       playersScore
//     }

//     return resObj;

//   } catch (error: any) {
//     logger.error(tableId, "CATCH_ERROR: formatMultiPlayerScore ::", error, "-", userScore, winner);
//     return false;
//   }


// }

// export = formatMultiPlayerScore;