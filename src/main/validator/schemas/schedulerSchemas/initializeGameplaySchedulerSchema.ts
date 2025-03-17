import Joi from "joi"


const initializeGameplaySchedulerSchema = Joi.object().keys({
    timer: Joi.number().description('exipire time'),
    tableId: Joi.string().description('table Id'),
    queueKey: Joi.string().description('queue Key'),
    currentRound: Joi.number().description('current Round'),
  }).unknown(true);

  export = initializeGameplaySchedulerSchema;
  