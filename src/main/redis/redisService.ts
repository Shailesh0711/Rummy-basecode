import { NUMERICAL, REDIS } from '../../constants';
import logger from '../../logger';

const { PREFIX } = REDIS;

class RedisService {
  public redisCommand: any;

  constructor(redisCommand: any) {
    this.redisCommand = redisCommand;
  }

  async setValueInKey(key: any, obj: any) {
    const keySet = await this.redisCommand.KEY.set(key, JSON.stringify(obj));
    return keySet;
  }

  async setValueInKeyWithExpiry(key: any, obj: any, exp = NUMERICAL.ONE_HOUR * 2) {
    try {

      return await this.redisCommand.KEY.setex(key, exp, JSON.stringify(obj));
    } catch (error) {
      logger.info("setValueInKeyWithExpiry :: ERROR", error)
    }
  }

  async getValueFromKey(key: any) {
    const valueStr = await this.redisCommand.KEY.get(key);
    return JSON.parse(valueStr);
  }

  /* Hash set queries */
  async setValueInHashKeyField(key: any, field: any, value: any) {
    const hashKey = `${PREFIX.HASH}:${key}`;
    const hashData = await this.redisCommand.HASH.hset(
      hashKey,
      field,
      JSON.stringify(value),
    );
    return hashData;
  }

  async getValueFromHashKeyFeild(key: any, field: any) {
    const hashKey = `${PREFIX.HASH}:${key}`;
    const resStr = await this.redisCommand.HASH.hget(hashKey, field);
    return JSON.parse(resStr) || {};
  }

  /* list queries */
  async pushIntoQueue(key: any, element: any) {
    return await this.redisCommand.QUEUE.push(
      `${key}`,
      JSON.stringify(element),
    );
  }

  async popFromQueue(key: any) {
    const resStr = await this.redisCommand.QUEUE.pop(`${key}`);
    return JSON.parse(resStr);
  }

  async deleteKey(Key: any) {
    return await this.redisCommand.KEY.delete(Key);
  }

  async setIncrementCounter(key: string){
    const valueStr = await this.redisCommand.KEY.increment(key);
    return JSON.parse(valueStr);
  }

  async setDecrementCounter(key: string){
    const valueStr = await this.redisCommand.KEY.decrement(key);
    return JSON.parse(valueStr);
  }
}

export = RedisService;
