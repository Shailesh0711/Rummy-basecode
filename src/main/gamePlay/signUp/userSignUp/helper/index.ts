import { NUMERICAL } from "../../../../../constants";
import logger from "../../../../../logger";
import { getUserOwnProfile } from "../../../../clientsideapi";
import { userIf } from "../../../../interfaces/userSignUpIf";
import { setUser } from "../../../cache/User";


export async function userProfileUpdate(userDetail: userIf, socketId: string): Promise<userIf> {
    try {
        const userOwnProfile = await getUserOwnProfile(userDetail.authToken, socketId, userDetail.userId);
        logger.info("userDetail ::: >>", userDetail);
        logger.info(userDetail.userId, "userOwnProfile  :: >> ", userOwnProfile, "Number(userDetail.latitude) :: ", Number(userDetail.location.latitude), "Number(userDetail.longitude) :: ", Number(userDetail.location.longitude));

        let latitude: string = `${NUMERICAL.ZERO}`;
        let longitude: string = `${NUMERICAL.ZERO}`;

        if (
            !userDetail.location.latitude ||
            !userDetail.location.longitude ||
            Number(userDetail.location.latitude) == NUMERICAL.ZERO ||
            Number(userDetail.location.longitude) == NUMERICAL.ZERO
        ) {
            latitude = userOwnProfile.latitude || "0.0";
            longitude = userOwnProfile.longitude || "0.0";
        }
        else {
            latitude = userDetail.location.latitude;
            longitude = userDetail.location.longitude;
        }

        //balance set in user profile
        const balance = userOwnProfile.bonus + userOwnProfile.winCash + userOwnProfile?.cash


        userDetail.location.latitude = latitude;
        userDetail.location.longitude = longitude;
        userDetail.balance =  50000;

        logger.info("updateUserQuery ::: >>", userDetail)
        await setUser(userDetail.userId, userDetail);

        return userDetail;

    } catch (error) {
        logger.error(userDetail._id, "CATCH_ERROR :userSignUp :: ", userDetail, error);
        throw error;
    }

}

