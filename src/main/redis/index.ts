import RedisService from './redisService';
import RedisCommands from './redisCommand';
class Redis {
  public commands: any;

  init(redisClient: any) {
    this.commands = new RedisService(new RedisCommands(redisClient));
  }
}

/**
 * exports db model services, it will be used to devs to fetch,insert or update data to databse
 */
export = new Redis();
