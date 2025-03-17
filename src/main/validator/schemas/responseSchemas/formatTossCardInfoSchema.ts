import Joi from "joi";
import tossWinnerPlayerSchema from "./helper/tossWinerPlayerSchema";


const formatTossCardInfoSchema = Joi.object().keys({
    tableId: Joi.string().required().description("table Id"),
    tossWinnerPlayer: tossWinnerPlayerSchema.description("toss Winner Player"),
    tossDetail: Joi.array().items(tossWinnerPlayerSchema).description("tossDetail")
}).unknown(true);

export = formatTossCardInfoSchema