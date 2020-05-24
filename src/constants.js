import { getLogger } from "log4js";
import * as WickrIOBotAPI from 'wickrio-bot-api'

const WickrUser = WickrIOBotAPI.WickrUser;
const bot = new WickrIOBotAPI.WickrIOBot();
const WickrIOAPI = bot.getWickrIOAddon();
const logger = getLogger();
logger.level = 'debug';
let client_auth_codes = {}

const {
  BOT_AUTH_TOKEN,
  BOT_KEY,
  BOT_PORT,
  WICKRIO_BOT_NAME,
  VERIFY_USERS
} = JSON.parse(process.env.tokens);

export {
  bot,
  WickrIOAPI,
  WickrUser,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
  BOT_KEY,
  BOT_PORT,
  WICKRIO_BOT_NAME,
  VERIFY_USERS
}




