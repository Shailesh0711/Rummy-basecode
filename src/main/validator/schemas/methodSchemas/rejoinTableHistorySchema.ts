import Joi from "joi"

const rejoinTableHistorySchema = Joi.object()
    .keys({
        userId: Joi.string().required().description('user Unique Id'),
        tableId: Joi.string().required().description('table Unique Id'),
        lobbyId: Joi.string().required().description('lobby Unique Id'),
        isEndGame: Joi.boolean().required().description('game End'),
    })
    .unknown(true);

export = rejoinTableHistorySchema;