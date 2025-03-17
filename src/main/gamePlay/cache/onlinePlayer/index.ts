import logger from '../../../../logger';
import { REDIS } from '../../../../constants';
import { NUMERICAL } from '../../../../constants';
import redis from "../../../redis";

export async function decrCounter(
  onlinePlayer: string
){
  const key = `${REDIS.PREFIX.ONLINE_USER_COUNTER}:${onlinePlayer}`;
  try {
    return redis.commands.setDecrementCounter(key);
  } catch (e) {
    logger.error(`Error in decrCounter for key ${key} `, e);
    return null;
  }
}

export async function incrCounter(
  onlinePlayer: string,
): Promise<boolean> {
  const key = `${REDIS.PREFIX.ONLINE_USER_COUNTER}:${onlinePlayer}`;
  try {
    return await redis.commands.setIncrementCounter(key);
  } catch (e) {
    logger.error(`Error in incrCounter for key ${key} `, e);
    return false;
  }
}

export async function getOnliPlayerCount(onlinePlayer: string){
  const key = `${REDIS.PREFIX.ONLINE_USER_COUNTER}:${onlinePlayer}`;
  try {
    return await redis.commands.getValueFromKey(key);
  } catch (e) {
    logger.error(`Error in getOnliPlayerCount for key ${key}`, e);
    return false;
  }
};

export async function getOnliPlayerCountLobbyWise(onlinePlayerLobby: string , lobbyId: string){
  try {
    const key = `${REDIS.PREFIX.ONLINE_USER_COUNTER}:${lobbyId}:${onlinePlayerLobby}`;
    return await redis.commands.getValueFromKey(key);
  } catch (error) {
    logger.error('CATCH_ERROR :  getOnliPlayerCountLobbyWise', error);
    return false;
  }
}


export async function setCounterIntialValue(onlinePlayer: string){
  try {
    let counter = NUMERICAL.ZERO;
    const key = `${REDIS.PREFIX.ONLINE_USER_COUNTER}:${onlinePlayer}`;
    return await redis.commands.setValueInKey(key, counter);
  } catch (error) {
    logger.error('CATCH_ERROR : setCounterIntialValue', error);
    return false;
  }
}

export async function setCounterIntialValueLobby(onlinePlayerLobby: string, lobbyId: string){
  try {
    let counter = NUMERICAL.ZERO;
    const key = `${REDIS.PREFIX.ONLINE_USER_COUNTER}:${lobbyId}:${onlinePlayerLobby}`;
    return await redis.commands.setValueInKeyWithExpiry(key, counter);
  } catch (error) {
    logger.error('CATCH_ERROR :  setCounterIntialValueLobby', error);
    return false;
  }
}

export async function removeOnliPlayerCountLobbyWise(onlinePlayerLobby: string , lobbyId: string){
  try {
    return await redis.commands.deleteKey(`${REDIS.PREFIX.ONLINE_USER_COUNTER}:${lobbyId}:${onlinePlayerLobby}`);
  } catch (error) {
    logger.error('CATCH_ERROR :  removeOnliPlayerCountLobbyWise', error);
    return false;
  }
}

export async function incrCounterLobbyWise(onlinePlayerLobby: string , lobbyId: string){
  try {
    return await redis.commands.setIncrementCounter(`${REDIS.PREFIX.ONLINE_USER_COUNTER}:${lobbyId}:${onlinePlayerLobby}`);
  } catch (error) {
    logger.error("CATCH_ERROR : incrCounterLobbyWise", error)
    throw error
  }
}

export async function decrCounterLobbyWise(onlinePlayerLobby: string , lobbyId: string){
  try {
    return await redis.commands.setDecrementCounter(`${REDIS.PREFIX.ONLINE_USER_COUNTER}:${lobbyId}:${onlinePlayerLobby}`);
  } catch (error) {
    logger.error("CATCH_ERROR : decrCounterLobbyWise", error)
    throw error
  }
}


// const exportedObject = { 
//   decrCounter, 
//   incrCounter, 
//   getOnliPlayerCount, 
//   getOnliPlayerCountLobbyWise, 
//   setCounterIntialValue, 
//   setCounterIntialValueLobby,
//   removeOnliPlayerCountLobbyWise,
//   incrCounterLobbyWise,
//   decrCounterLobbyWise
// };

// export = exportedObject;
