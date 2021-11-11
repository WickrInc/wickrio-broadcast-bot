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
  apiService,
} from './helpers/constants'
import Factory from './factory'
import SetupService from './services/setup-service'
import JSONCredentialsHandler from './helpers/json-credentials-handler'

if (!fs.existsSync(`${process.cwd()}/attachments`)) {
  fs.mkdirSync(`${process.cwd()}/attachments`)
}

if (!fs.existsSync(`${process.cwd()}/files`)) {
  fs.mkdirSync(`${process.cwd()}/files`)
}

let setupService
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

    if (WEB_APPLICATION?.value === 'yes' || REST_APPLICATION?.value === 'yes') {
      startServer()
    } else {
      logger.info(
        'If you wanted a web or rest interface, the env variables not set properly. Check BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT'
      )
    }

    const adminList = bot.getAdmins()
    const setupData = { admins: {} }
    for (const admin of adminList) {
      logger.debug('admin' + admin)
      setupData.admins[admin] = false
    }

    const setupHandler = new JSONCredentialsHandler(
      setupData,
      './setupData.json'
    )

    setupService = new SetupService(setupHandler)
    const setupAdmins = []
    for (const admin of bot.getAdmins()) {
      if (!setupService.alreadySetup(admin)) {
        setupAdmins.push(admin)
      }
    }
    const welcomeObj = SetupService.getWelcomeMessage()
    const welcomeMessage = welcomeObj.reply
    const welcomeMessagemeta = JSON.stringify(welcomeObj.messagemeta)
    logger.debug(welcomeMessagemeta)
    if (setupAdmins.length > 0) {
      apiService.send1to1Message(
        setupAdmins,
        welcomeMessage,
        '',
        '',
        '',
        [],
        welcomeMessagemeta
      )
    }
    // Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen)
  } catch (err) {
    logger.error(err)
  }
}

async function listen(rawMessage) {
  try {
    // logger.debug({ rawMessage })
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
      isAdmin,
      // latitude,
      // longitude,
      // location,
      // isVoiceMemo,
      // voiceMemoDuration,
    } = messageService

    if (isAdmin && !setupService.alreadySetup(userEmail)) {
      logger.debug('isAdmin and not already setup')
      setupService.setupComplete(userEmail)
    }

    // do not handle non location and messages
    if (msgType !== 'location' && msgType !== 'file' && msgType !== undefined) {
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

    if (cmdResult?.reply) {
      if (cmdResult?.messagemeta) {
        logger.verbose('Object has a reply and message meta')
        const metastring = JSON.stringify(cmdResult.messagemeta)
        WickrIOAPI.cmdSendRoomMessage(
          vGroupID,
          cmdResult.reply,
          '',
          '',
          '',
          [],
          metastring
        )
      } else {
        WickrIOAPI.cmdSendRoomMessage(vGroupID, cmdResult.reply)
      }
    }

    if (cmdResult?.state || cmdResult?.state === 0) {
      // change to broacastservice?
      user.currentState = cmdResult.state
    } else {
      user.currentState = 0
    }
  } catch (err) {
    logger.error(err)
    logger.error('Got an error')
  }
}

main()
