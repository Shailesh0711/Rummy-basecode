import { NUMERICAL, PLAYER_STATE } from "../../../constants";
import logger from "../../../logger";
import { userSeatKeyIF } from "../../interfaces/roundTableIf";


export async function emetyTableSeats(
    seatsObj: userSeatKeyIF[]
) {
    try {

        seatsObj.sort((a, b) => {
            return a.seatIndex - b.seatIndex
        });

        const lastSeatIndex: number = seatsObj[seatsObj.length - NUMERICAL.ONE].seatIndex;
        const seats: userSeatKeyIF[] = [];

        for (let i = 0; i <= lastSeatIndex; i++) {
            const findUser = seatsObj.filter((seat) => seat.seatIndex === i);
            if (findUser.length == NUMERICAL.ONE) {
                seats.push(findUser[NUMERICAL.ZERO])
            } else {
                const obj: userSeatKeyIF = {
                    _id: "",
                    seatIndex: i,
                    userId: "",
                    username: "",
                    profilePicture: "",
                    userStatus: PLAYER_STATE.PLAYING
                }
                seats.push(obj)
            }
        }

        return seats;

    } catch (error) {
        logger.error(`--- emetyTableSeats :: ERROR :: `, error);
        throw error;
    }
}