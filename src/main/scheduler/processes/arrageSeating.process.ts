import config from "../../../connections/config";
import { EVENTS, EVENT_EMITTER, NUMERICAL, PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import commonEventEmitter from "../../commonEventEmitter";
import { getPlayerGamePlay } from "../../gamePlay/cache/Players";
import { getRoundTableData } from "../../gamePlay/cache/Rounds";
import { getTableData } from "../../gamePlay/cache/Tables";
import { getUser } from "../../gamePlay/cache/User";
import formatBootCollectionInfo from "../../gamePlay/formatResponse/formatBootCollectionInfo";
// import Scheduler from "../../scheduler"
import { BootAmountCollect } from "../queues";
const _ = require("underscore");

async function arrageSeatingProcess(job: any) {
    const { BOOT_COLLECTION_TIMER } = config()
    try {
        // logger.info("---->> arrageSeatingProcess :: JOB ::", job)
        logger.info("---->> arrageSeatingProcess :: Job Data ::", job.data)

        // commonEventEmitter.emit(EVENT_EMITTER.BOOT_AMOUNT_COLLECTION_TIMER, job.data)
        const tableData = await getTableData(job.data.tableId);
        logger.info("----->> arrageSeatingProcess :: tableData :: ", tableData);

        const roundTableData = await getRoundTableData(job.data.tableId, job.data.currentRound);
        logger.info("---->> arrageSeatingProcess :: roundTableData ::", roundTableData);

        const listOfSeatsIndex: number[] = [];
        const playingUsers = [];
        for await (const ele of Object.keys(roundTableData.seats)) {
            if (Object.keys(roundTableData.seats[ele]).length > NUMERICAL.ZERO) {
                if (roundTableData.seats[ele].userStatus === PLAYER_STATE.PLAYING) {
                    listOfSeatsIndex.push(roundTableData.seats[ele].seatIndex)
                    playingUsers.push(roundTableData.seats[ele].userId)
                }
            }
        }

        logger.info("---->> arrageSeatingProcess :: listOfSeatsIndex ::", listOfSeatsIndex);
        logger.info("---->> arrageSeatingProcess :: playingUsers ::", playingUsers);
        const userIds: string[] = _.compact(playingUsers);

        for await (let userID of userIds) {

            const playerData = await getPlayerGamePlay(userID, job.data.tableId);
            logger.info("---->> arrageSeatingProcess :: playerData ::", playerData);

            const userInfo = await getUser(userID);
            logger.info("---->> arrageSeatingProcess :: userInfo ::", userInfo);

            const bootCollectData = {
                balance: userInfo.balance,
                listOfSeatsIndex: listOfSeatsIndex,
                winPrice: tableData.winPrice
            }

            const formatedResponse = await formatBootCollectionInfo(bootCollectData);
            logger.info("---> arrageSeatingProcess :: formatBootCollectionInfo :: ", formatedResponse);

            commonEventEmitter.emit(EVENTS.COLLECT_BOOT_VALUE_SOCKET_EVENT, {
                socket: playerData.socketId,
                data: formatedResponse
            });

        }

        const schedulerData = {
            timer: BOOT_COLLECTION_TIMER * NUMERICAL.THOUSAND,
            tableId: job.data.tableId,
            currentRound: job.data.currentRound
        }

        commonEventEmitter.emit(EVENT_EMITTER.START_COLLECT_BOOT_TIMER_QUEUE, schedulerData);


        // await BootAmountCollect({
        //     timer: BOOT_COLLECTION_TIMER * NUMERICAL.THOUSAND,
        //     tableId: job.data.tableId,
        //     currentRound: job.data.currentRound
        // })
    } catch (error) {
        logger.error("arrageSeatingProcess :: ERROR ::", error);
        return undefined;
    }
}

export = arrageSeatingProcess