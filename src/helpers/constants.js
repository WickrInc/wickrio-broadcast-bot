import { getLogger } from 'log4js'
import * as WickrIOBotAPI from 'wickrio-bot-api'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

// import { cronJob } from 'cron'

const WickrUser = WickrIOBotAPI.WickrUser
const bot = new WickrIOBotAPI.WickrIOBot()
const WickrIOAPI = bot.getWickrIOAddon()
const logger = getLogger()
logger.level = 'debug'
const client_auth_codes = {}

// Read in the processes.json file 
const processesJsonFile = path.join(process.cwd(), 'processes.json')
if (!fs.existsSync(processesJsonFile)) {
  console.error(processesJsonFile + ' does not exist!')
  process.exit(1)
}
const processesJson = fs.readFileSync(processesJsonFile);
console.log('processes.json=' + processesJson)
const processesJsonObject = JSON.parse(processesJson)

process.env['tokens'] = JSON.stringify(processesJsonObject.apps[0].env.tokens)

console.log('end process.env=' + JSON.stringify(process.env))
console.log('end process.env.tokens=' + process.env.tokens)

const {
  BOT_AUTH_TOKEN,
  BOT_KEY,
  BOT_MAPS,
  BOT_PORT,
  BOT_GOOGLE_MAPS,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  WEBAPP_PORT,
  HTTPS_CHOICE,
  WEBAPP_HOST,
  WEB_APPLICATION,
  REST_APPLICATION,
  SSL_KEY_LOCATION,
  WEB_INTERFACE,
  SSL_CRT_LOCATION,
  BROADCAST_ENABLED,
  RESPONSES_ENABLED,
  LIMIT_FILE_ENTRIES,
  FILE_ENTRY_SIZE,
  ADMINISTRATORS_CHOICE,
} = JSON.parse(process.env.tokens)

const updateLastID = () => {
  try {
    let id

    if (fs.existsSync('last_id.json')) {
      const data = fs.readFileSync('last_id.json')
      logger.debug('is the data okay: ' + data)
      const lastID = JSON.parse(data)
      id = Number(lastID) + 1
    } else {
      id = '1'
    }
    logger.debug('This is the id: ' + id)
    const idToWrite = JSON.stringify(id, null, 2)
    fs.writeFile('last_id.json', idToWrite, err => {
      // Fix this
      if (err) throw err
      logger.trace('Current Message ID saved in file')
    })
    return id.toString()
  } catch (err) {
    logger.error(err)
  }
}

function getLastID() {
  try {
    let lastID
    if (fs.existsSync('last_id.json')) {
      const data = fs.readFileSync('last_id.json')
      logger.debug('is the data okay: ' + data)
      lastID = JSON.parse(data)
    } else {
      lastID = '1'
      fs.writeFile('last_id.json', lastID, err => {
        // Fix this
        if (err) throw err
        logger.trace('Current Message ID saved in file')
      })
    }
    logger.debug('This is the id: ' + lastID)
    return lastID
  } catch (err) {
    logger.error(err)
  }
}

// let cronJob = (
//   job,
//   cronInterval,
//   user,
//   broadcast,
//   sgFlag,
//   ackFlag,
//   securityGroupsToSend,
//   userEmail,
//   target
// ) => {
//   const cronjob = new CronJob(cronInterval, () => {
//     const currentDate = new Date()
//     const jsonDateTime = currentDate.toJSON()
//     let bMessage
//     let messageId = updateLastID()
//     logger.debug('CronJob', sgFlag)
//     let broadcastMsgToSend = broadcast
//     if (ackFlag) {
//       broadcastMsgToSend =
//         broadcastMsgToSend +
//         '\nPlease acknowledge this message by replying with /ack'
//     }
//     broadcastMsgToSend =
//       broadcastMsgToSend + '\n\nBroadcast message sent by: ' + userEmail
//     if (sgFlag) {
//       bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(
//         broadcastMsgToSend,
//         securityGroupsToSend,
//         '',
//         '',
//         messageId
//       )
//       messageId = '' + messageId
//       writeToMessageIdDB(messageId, userEmail, target, jsonDateTime, broadcast)
//       asyncStatus(messageId, user.vGroupID)
//     } else {
//       messageId = '' + messageId
//       bMessage = WickrIOAPI.cmdSendNetworkMessage(
//         broadcastMsgToSend,
//         '',
//         '',
//         messageId
//       )
//       logger.debug(
//         'messageId: ' +
//           messageId +
//           'userEmail' +
//           userEmail +
//           'target' +
//           target +
//           'dt' +
//           jsonDateTime +
//           'bcast' +
//           broadcast
//       )
//       writeToMessageIdDB(messageId, userEmail, target, jsonDateTime, broadcast)
//       asyncStatus(messageId, user.vGroupID)
//     }
//     logger.debug(bMessage)
//     const reply = strings.repeatMessageSent.replace('%{count}', user.count + 1)
//     const uMessage = WickrIOAPI.cmdSendRoomMessage(user.vGroupID, reply)
//     // Will this stay the same or could user be reset?? I believe only can send one repeat message
//     user.count += 1
//     if (user.count > user.repeat) {
//       user.cronJobActive = false
//       return job.stop()
//     }
//   })
//   cronjob.start()
//   user.cronJobActive = true
// }
const apiService = bot.apiService()
export {
  bot,
  apiService,
  WickrIOAPI,
  WickrUser,
  client_auth_codes,
  WEB_INTERFACE,
  logger,
  BOT_AUTH_TOKEN,
  WEB_APPLICATION,
  SSL_CRT_LOCATION,
  REST_APPLICATION,
  BOT_KEY,
  SSL_KEY_LOCATION,
  HTTPS_CHOICE,
  BOT_MAPS,
  BOT_PORT,
  BOT_GOOGLE_MAPS,
  WEBAPP_HOST,
  WEBAPP_PORT,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  updateLastID,
  getLastID,
  BROADCAST_ENABLED,
  RESPONSES_ENABLED,
  LIMIT_FILE_ENTRIES,
  FILE_ENTRY_SIZE,
  ADMINISTRATORS_CHOICE,
  // cronJob,
}
