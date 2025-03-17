import Joi from "joi"

const formatJoinTableInfoSchema = Joi.object().keys({
  _id: Joi.string().description('user Unique Id'),
  userId: Joi.string().description('user Unique Id'),
  username: Joi.string().allow('').description('user name'),
  profilePicture: Joi.string().allow('').description('user profile pic'),
  seatIndex: Joi.number().description('user seat index'),
  userStatus: Joi.string().allow('').description('user profile pic'),
}).unknown(true);

export = formatJoinTableInfoSchema;
