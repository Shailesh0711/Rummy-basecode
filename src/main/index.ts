require("./commonEventHandlers/socket")
import Redis from "./redis";
import DB from "./db"

const exportObject = {
  Redis,
  DB,
}

export = exportObject