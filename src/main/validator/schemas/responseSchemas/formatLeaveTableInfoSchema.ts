import Joi from "joi";

const formatLeaveTableInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    userId: Joi.string().required().description("user Id"), 
    seatIndex: Joi.number().required().description("seat Index"),
    currentRound: Joi.number().required().description("current Round"),
    tableState: Joi.string().required().description("tableState"), 
    updatedUserCount: Joi.number().required().description("updated User Count"), 
    message: Joi.string().required().description("message"), 
    winPrize : Joi.number(),
    isLeaveBeforeLockIn : Joi.boolean()
}).unknown(true);

export = formatLeaveTableInfoSchema;