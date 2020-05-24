import { getLogger } from "log4js";
import * as WickrIOBotAPI from 'wickrio-bot-api'
import fs from 'fs';

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

const updateLastID = () => {
  try {
    var id;
    if (fs.existsSync('last_id.json')) {
      var data = fs.readFileSync('last_id.json');
      logger.debug("is the data okay: " + data);
      var lastID = JSON.parse(data);
      id = Number(lastID) + 1;
    } else {
      id = '1';
    }
    logger.debug("This is the id: " + id);
    var idToWrite = JSON.stringify(id, null, 2);
    fs.writeFile('last_id.json', idToWrite, (err) => {
      //Fix this 
      if (err) throw err;
      logger.trace("Current Message ID saved in file");
    });
    return id.toString();
  } catch (err) {
    logger.error(err);
  }
}

const cronJob = (job, cronInterval, user, broadcast, sgFlag, ackFlag, securityGroupsToSend, userEmail, target) => {
  let cronjob = new CronJob(cronInterval, () => {
    var currentDate = new Date();
    var jsonDateTime = currentDate.toJSON();
    var bMessage;
    var messageId = updateLastID();
    logger.debug("CronJob", sgFlag);
    var broadcastMsgToSend = broadcast;
    if (ackFlag) {
      broadcastMsgToSend = broadcastMsgToSend + "\nPlease acknowledge this message by replying with /ack";
    }
    broadcastMsgToSend = broadcastMsgToSend + "\n\nBroadcast message sent by: " + userEmail;
    if (sgFlag) {
      bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(broadcastMsgToSend, securityGroupsToSend, "", "", messageId);
      messageId = "" + messageId;
      writeToMessageIdDB(messageId, userEmail, target, jsonDateTime, broadcast);
      asyncStatus(messageId, user.vGroupID);
    } else {
      messageId = "" + messageId;
      bMessage = WickrIOAPI.cmdSendNetworkMessage(broadcastMsgToSend, "", "", messageId);
      logger.debug("messageId: " + messageId + "userEmail" + userEmail + "target" + target + "dt" + jsonDateTime + "bcast" + broadcast);
      writeToMessageIdDB(messageId, userEmail, target, jsonDateTime, broadcast);
      asyncStatus(messageId, user.vGroupID);
    }
    logger.debug(bMessage);
    var reply = strings["repeatMessageSent"].replace("%{count}", (user.count + 1));
    var uMessage = WickrIOAPI.cmdSendRoomMessage(user.vGroupID, reply);
    //Will this stay the same or could user be reset?? I believe only can send one repeat message
    user.count += 1;
    if (user.count > user.repeat) {
      user.cronJobActive = false;
      return job.stop();
    }
  });
  cronjob.start();
  user.cronJobActive = true;
}

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
  VERIFY_USERS,
  updateLastID,
  cronJob
}




