import Joi from "joi"

const groupingCard = Joi.object().keys({
    pure: Joi.array().allow("").default([]).description("pure card group"),
    impure: Joi.array().allow("").default([]).description("impure card group"),
    set: Joi.array().allow("").default([]).description("set card group"),
    dwd: Joi.array().allow("").default([]).description("dwd card group"),
    wildCards: Joi.array().allow("").default([]).description("wildCards card group"),
}).unknown(true);;


export = groupingCard