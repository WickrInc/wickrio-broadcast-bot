import fs from 'fs'
import startServer from './api'
import {
  bot,
  logger,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  WickrIOAPI,
  WEB_APPLICATION,
  REST_APPLICATION,
} from './helpers/constants'
import Factory from './factory'

if (!fs.existsSync(`${process.cwd()}/attachments`)) {
  fs.mkdirSync(`${process.cwd()}/attachments`)
}

if (!fs.existsSync(`${process.cwd()}/files`)) {
  fs.mkdirSync(`${process.cwd()}/files`)
}
const runHandlers = () => {
  // STANDARDIZE BELOW -----------

  process.stdin.resume() // so the program will not close instantly

  process.stdin.resume() // so the program will not close instantly

  // catches ctrl+c and stop.sh events
  process.on('SIGINT', exitHandler.bind(null, { exit: true }))

  // catches "kill pid" (for example: nodemon restart)
  process.on('SIGUSR1', exitHandler.bind(null, { pid: true }))
  process.on('SIGUSR2', exitHandler.bind(null, { pid: true }))

  // TODO clear these values!
  // TODO make these user variables??

  // catches uncaught exceptions
  // TODO make this more robust of a catch

  process.on('uncaughtException', exitHandler.bind(null, { exit: true }))
  // STANDARDIZE ABOVE -----------
}
async function exitHandler(options, err) {
  try {
    await bot.close()
    if (err || options.exit) {
      logger.error('Exit reason:', err)
      process.exit()
    } else if (options.pid) {
      process.kill(process.pid)
    }
  } catch (err) {
    logger.error(err)
  }
}
async function main() {
  runHandlers()
  try {
    const status = await bot.start(WICKRIO_BOT_NAME.value)

    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start',
      })
    }

    // TODO set to true and send from a non admin and see what happens
    bot.setAdminOnly(false)

    // set the verification mode to true
    let verifyUsersMode
    if (VERIFY_USERS.encrypted) {
      verifyUsersMode = WickrIOAPI.cmdDecryptString(VERIFY_USERS.value)
    } else {
      verifyUsersMode = VERIFY_USERS.value
    }

    bot.setVerificationMode(verifyUsersMode)

    WickrIOAPI.cmdSetControl('cleardb', 'false')
    WickrIOAPI.cmdSetControl('contactbackup', 'false')
    WickrIOAPI.cmdSetControl('convobackup', 'false')
    WickrIOAPI.cmdSetControl('readreceipt', 'true')

    // Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen)

    if (WEB_APPLICATION?.value === 'yes' || REST_APPLICATION?.value === 'yes') {
      startServer()
    } else {
      console.log(
        'If you wanted a web or rest interface, the env variables not set properly. Check BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT'
      )
    }
  } catch (err) {
    console.log(err)
  }
}

async function listen(rawMessage) {
  try {
    // console.log({ rawMessage })
    const messageService = bot.messageService({ rawMessage })
    const {
      // time,
      // botName,
      // messageID,
      // users,
      // ttl,
      // bor,
      // control,
      // msgTS,
      // receiver,
      // filepath,
      // file,
      // filename,
      // message,
      // command,
      // argument,
      vGroupID,
      // convoType,
      msgType,
      user,
      userEmail,
      // isAdmin,
      // latitude,
      // longitude,
      // location,
      // isVoiceMemo,
      // voiceMemoDuration,
    } = messageService

    // do not handle non location and messages
    if (msgType !== 'location'&& msgType !== 'file' && msgType !== undefined) {
      return
    }

    if (!fs.existsSync(`${process.cwd()}/files/${userEmail}`)) {
      fs.mkdirSync(`${process.cwd()}/files/${userEmail}`)
    }

    const factory = new Factory({
      messageService,
    })
    let cmdResult
    if (msgType !== 'location') {
      cmdResult = factory.execute()
    }

    if (cmdResult?.reply)
      WickrIOAPI.cmdSendRoomMessage(vGroupID, cmdResult.reply)

    if (cmdResult?.state || cmdResult?.state === 0) {
      // change to broacastservice?
      user.currentState = cmdResult.state
    }
  } catch (err) {
    logger.error(err)
    logger.error('Got an error')
  }
}

main()
