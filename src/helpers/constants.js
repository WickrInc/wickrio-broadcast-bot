import * as WickrIOBotAPI from 'wickrio-bot-api'
import fs from 'fs'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

const WickrUser = WickrIOBotAPI.WickrUser
const bot = new WickrIOBotAPI.WickrIOBot()
const WickrIOAPI = bot.getWickrIOAddon()
const client_auth_codes = {}

// Read in the processes.json file
const processesJsonFile = path.join(process.cwd(), 'processes.json')
if (!fs.existsSync(processesJsonFile)) {
  console.error(processesJsonFile + ' does not exist!')
  process.exit(1)
}
const processesJson = fs.readFileSync(processesJsonFile)
const processesJsonObject = JSON.parse(processesJson)

process.env.tokens = JSON.stringify(processesJsonObject.apps[0].env.tokens)
process.env.log_tokens = JSON.stringify(
  processesJsonObject.apps[0].env.log_tokens
)

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

let { LOG_LEVEL, LOG_FILE_SIZE, LOG_MAX_FILES } = JSON.parse(
  process.env.log_tokens
)

if (LOG_LEVEL?.value === undefined) {
  if (LOG_LEVEL === undefined) {
    processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL = {}
    LOG_LEVEL = {}
  }
  LOG_LEVEL.value = 'info'
  processesJsonObject.apps[0].env.log_tokens.LOG_LEVEL.value = 'info'
}
if (LOG_FILE_SIZE?.value === undefined) {
  if (LOG_FILE_SIZE === undefined) {
    processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE = {}
    LOG_FILE_SIZE = {}
  }
  LOG_FILE_SIZE.value = '10m'
  processesJsonObject.apps[0].env.log_tokens.LOG_FILE_SIZE.value = '10m'
}
if (LOG_MAX_FILES?.value === undefined) {
  if (LOG_MAX_FILES === undefined) {
    processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES = {}
    LOG_MAX_FILES = {}
  }
  LOG_MAX_FILES.value = '5'
  processesJsonObject.apps[0].env.log_tokens.LOG_MAX_FILES.value = '5'
}

try {
  fs.writeFileSync(
    processesJsonFile,
    // Write the JSON object with 2 spaces and indentation
    JSON.stringify(processesJsonObject, null, 2),
    err => {
      if (err) throw err
    }
  )
} catch (err) {
  console.error(err)
}

const updateLastID = () => {
  try {
    let id

    if (fs.existsSync('last_id.json')) {
      const data = fs.readFileSync('last_id.json')
      // logger.debug('is the data okay: ' + data)
      const lastID = JSON.parse(data)
      id = Number(lastID) + 1
    } else {
      id = '1'
    }
    // logger.debug('This is the id: ' + id)
    const idToWrite = JSON.stringify(id, null, 2)
    fs.writeFile('last_id.json', idToWrite, err => {
      // Fix this
      if (err) throw err
      // logger.verbose('Current Message ID saved in file')
    })
    return id.toString()
  } catch (err) {
    console.error(err)
  }
}

function getLastID() {
  try {
    let lastID
    if (fs.existsSync('last_id.json')) {
      const data = fs.readFileSync('last_id.json')
      // logger.debug('is the data okay: ' + data)
      lastID = JSON.parse(data)
    } else {
      lastID = '1'
      fs.writeFile('last_id.json', lastID, err => {
        // Fix this
        if (err) throw err
        // logger.verbose('Current Message ID saved in file')
      })
    }
    // logger.debug('This is the id: ' + lastID)
    return lastID
  } catch (err) {
    console.error(err)
  }
}

const apiService = bot.apiService()
export {
  bot,
  apiService,
  WickrIOAPI,
  WickrUser,
  client_auth_codes,
  WEB_INTERFACE,
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
  LOG_LEVEL,
  LOG_FILE_SIZE,
  LOG_MAX_FILES,
}
