import fs from 'fs'
// import jwt from 'jsonwebtoken'
import startServer from './api'
import {
  bot,
  // WickrUser,
  // client_auth_codes,
  logger,
  // BOT_AUTH_TOKEN,
  // WEBAPP_HOST,
  // WEBAPP_PORT,
  // HTTPS_CHOICE,
  // BOT_PORT,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  WickrIOAPI,
  WEB_APPLICATION,
  REST_APPLICATION,
} from './helpers/constants'

// const pkgjson = require('./package.json');
import writer from './helpers/message-writer.js'
// import Version from './commands/version'
import Factory from './factory'
import State from './state'
// import APIService from './services/api-service'
// import BroadcastService from './services/broadcast-service'
// import MessageService from './services/message-service'
// import SendService from './services/send-service'
// import StatusService from './services/status-service'
// import RepeatService from './services/repeat-service'
// import ReportService from './services/report-service'
import GenericService from './services/generic-service'
// import BroadcastService from './services/broadcast-service'
// import APIService from './services/api-service'
// import FileService from './services/file-service'

// let currentState
let verifyUsersMode
// const webAppString = ''
// const webAppEnabled = WEB_APPLICATION.value === 'yes'

process.stdin.resume() // so the program will not close instantly

process.stdin.resume() // so the program will not close instantly
// why
if (!fs.existsSync(`${process.cwd()}/attachments`)) {
  fs.mkdirSync(`${process.cwd()}/attachments`)
}

// why
if (!fs.existsSync(`${process.cwd()}/files`)) {
  fs.mkdirSync(`${process.cwd()}/files`)
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

async function main() {
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
    if (VERIFY_USERS.encrypted) {
      verifyUsersMode = WickrIOAPI.cmdDecryptString(VERIFY_USERS.value)
    } else {
      verifyUsersMode = VERIFY_USERS.value
    }

    bot.setVerificationMode(verifyUsersMode)

    WickrIOAPI.cmdSetControl('cleardb', 'true')
    WickrIOAPI.cmdSetControl('contactbackup', 'false')
    WickrIOAPI.cmdSetControl('convobackup', 'false')
    WickrIOAPI.cmdSetControl('readreceipt', 'true')

    // Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen)

    if (WEB_APPLICATION.value === 'yes' || REST_APPLICATION.value === 'yes') {
      // run server
      startServer()
    } else {
      console.log(
        'If you wanted a web or rest interface, the env variables not set properly. Check BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT'
      )
    }
    // await bot.startListening(listen); //Passes a callback function that will receive incoming messages into the bot client
  } catch (err) {
    console.log(err)
  }
}

async function listen(rawMessage) {
  try {
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
      message,
      // command,
      // argument,
      vGroupID,
      // convoType,
      msgType,
      user,
      userEmail,
      isAdmin,
      latitude,
      longitude,
      // location,
      // isVoiceMemo,
      // voiceMemoDuration,
    } = messageService.getMessageData()

    // what is this for
    if (!fs.existsSync(`${process.cwd()}/files/${userEmail}`)) {
      fs.mkdirSync(`${process.cwd()}/files/${userEmail}`)
    }

    if (msgType === 'location') {
      // acknowledges all messages sent to user
      const obj = {
        location: {
          latitude: latitude,
          longitude: longitude,
        },
      }
      const statusMessage = JSON.stringify(obj)
      const genericService = new GenericService(10, user)
      genericService.setMessageStatus('', `${userEmail}`, '3', statusMessage)
      user.currentState = State.NONE
      return
    }

    // if (!parsedMessage) {
    //   // why are we writing?
    //   await writer.writeFile(rawMessage)
    //   return
    // }
    // let wickrUser
    // const personalVGroupID = ''

    // file = '' + file
    // filename = '' + filename

    // Go back to dev toolkit and fix
    /*
    if(convoType === 'personal') {
      personalVGroupID = vGroupID;
    } else {
      writer.writeFile(message);
      return;
    }
    */
    //  const broadcastService = new BroadcastService(user)
    //  const repeatService = new RepeatService(broadcastService, user)
    //  const sendService = new SendService(user)
    //  const fileService = new FileService(user)
    //  const genericService = new GenericService(10, user)

    //  const factory = new Factory(
    //    broadcastService,
    //    sendService,
    //    StatusService,
    //    repeatService,
    //    ReportService,
    //    genericService,
    //    fileService
    //  )

    // const apiService = new APIService()
    // const broadcastService = new BroadcastService({
    //   messageService,
    //   apiService,
    // })
    // const factory = new Factory({ messageService, broadcastService })
    const factory = new Factory({ messageService })

    // Send the location as an acknowledgement
    // TODO create a pre-admin factory method with all the commands that are pre-admin

    // if (command === '/version') {
    //   const obj = Version.execute()
    //   WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply)
    //   user.currentState = State.NONE
    //   return
    // }

    // if (command === '/ack') {
    //   const userEmailString = `${userEmail}`
    //   genericService.setMessageStatus('', userEmailString, '3', '')
    //   user.currentState = State.NONE
    //   return
    // }

    // if (webAppEnabled) {
    //   webAppString =
    //     '*Web App Commands*\n' +
    //     '/panel : displays the link and token to the web user interface\n\n'
    // }

    // // TODO  put this in it's own command
    // if (command === '/help') {
    //   const helpString =
    //     '*Messages Commands*\n' +
    //     '/send <Message> : To send a broadcast message to a given file of user hashes or usernames\n' +
    //     'To save a file of usernames or user hashes - Click the + sign and share the file with the bot\n' +
    //     '/broadcast <Message> : To send a broadcast message to the network or security groups\n' +
    //     'To broadcast a file - Click the + sign and share the file with the bot\n' +
    //     'To broadcast a voice memo - Click the microphone button and send a voice memo to the bot\n' +
    //     '/ack : To acknowledge a broadcast message \n' +
    //     '/messages : To get a text file of all the messages sent to the bot\n' +
    //     '/status : To get the status of a broadcast message\n' +
    //     '/report : To get a CSV file with the status of each user for a broadcast message\n' +
    //     '/abort : To abort a broadcast or send that is currently in progress\n\n' +
    //     `${webAppString}` +
    //     '*Admin Commands*\n' +
    //     '%{adminHelp}\n' +
    //     '*Other Commands*\n' +
    //     '/help : Show help information\n' +
    //     '/version : Get the version of the integration\n' +
    //     '/cancel : To cancel the last operation and enter a new command\n' +
    //     '/files : To get a list of saved files available for the /send command\n' +
    //     '/delete : To delete a file that was previously made available for the /send command\n'
    //   const reply = bot.getAdminHelp(helpString)
    //   logger.debug(`vgroupID in help:${vGroupID}`)
    //   // const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    //   const sMessage = APIService.sendRoomMessage(vGroupID, reply)
    //   logger.debug(sMessage)
    //   user.currentState = State.NONE
    //   return
    // }

    if (!isAdmin) {
      const reply = `Hey this bot is just for announcements and can't respond to you personally, or ${userEmail} is not authorized to use this bot. If you have a question, please get a hold of us a support@wickr.com or visit us a support.wickr.com. Thanks, Team Wickr`
      const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
      logger.debug({ sMessage })
      writer.writeFile(message)
      return
    }

    // TODO is this JSON.stringify necessary??
    // How to deal with duplicate files??
    // TODO parse argument better??
    const cmdResult = factory.execute()
    console.log({ cmdResult })

    if (cmdResult?.reply)
      WickrIOAPI.cmdSendRoomMessage(vGroupID, cmdResult.reply)

    // if (cmdResult?.state)
    // messageService.updateUserStateInDB({ currentState: cmdResult.state })
  } catch (err) {
    logger.error(err)
    logger.error('Got an error')
  }
}

main()
