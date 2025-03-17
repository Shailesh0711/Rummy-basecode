
class RedisCommands {
    public KEY: any;
    public SET: any;
    public SORTEDSET: any;
    public QUEUE: any;
    public HASH: any;
  
    constructor(redisClient: any) {
      this.KEY = {
        set: (redisClient.set).bind(redisClient),
        setex: (redisClient.setEx).bind(redisClient),
        get: (redisClient.get).bind(redisClient),
        mset: (redisClient.mSet).bind(redisClient),
        delete: (redisClient.del).bind(redisClient),
        setnx: (redisClient.setNX).bind(redisClient),
        pexpire: (redisClient.pExpire).bind(redisClient),
        increment : (redisClient.incr).bind(redisClient),
        decrement : (redisClient.decr).bind(redisClient),
      };
  
      this.SET = {
        add: (redisClient.sAdd).bind(redisClient),
        rem: (redisClient.sRem).bind(redisClient),
      };
  
      this.SORTEDSET = {
        add: (redisClient.zAdd).bind(redisClient),
        rem: (redisClient.zRem).bind(redisClient),
      };
  
      this.QUEUE = {
        push: (redisClient.rPush).bind(redisClient),
        pop: (redisClient.lPop).bind(redisClient),
        peek: (redisClient.lRange).bind(redisClient),
      };
  
      this.HASH = {
        hset: (redisClient.hSet).bind(redisClient),
        hget: (redisClient.hGet).bind(redisClient),
        hdel: (redisClient.hDel).bind(redisClient),
        hmget: (redisClient.hmGet).bind(redisClient),
        hgetall: (redisClient.hGetAll).bind(redisClient),
      };
    }
  }
  
  export = RedisCommands;
  