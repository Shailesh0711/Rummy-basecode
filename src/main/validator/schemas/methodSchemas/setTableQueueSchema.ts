import Joi from "joi";


const setTableQueueSchema = Joi.array().items(Joi.string()).default([]);

export = setTableQueueSchema;