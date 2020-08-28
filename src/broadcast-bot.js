import fs from 'fs'
import jwt from 'jsonwebtoken'
import startServer from './api'
import {
  bot,
  WickrUser,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
  WEBAPP_HOST,
  WEBAPP_PORT,
  HTTPS_CHOICE,
  BOT_PORT,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  WickrIOAPI,
  WEB_APPLICATION,
  REST_APPLICATION,
} from './helpers/constants'

// const pkgjson = require('./package.json');
import writer from './helpers/message-writer.js'
import Version from './commands/version'
import Factory from './factory'
import State from './state'
import APIService from './services/api-service'
import BroadcastService from './services/broadcast-service'
import MessageService from './services/message-service'
import SendService from './services/send-service'
import StatusService from './services/status-service'
import RepeatService from './services/repeat-service'
import ReportService from './services/report-service'
import GenericService from './services/generic-service'
import FileService from './services/file-service'

let currentState
let verifyUsersMode
let webAppString = ''
const webAppEnabled = WEB_APPLICATION.value === 'yes'

// need to be able to debug and lint for syntax errors
//
// Web interface definitions
//
process.stdin.resume() // so the program will not close instantly

// const {exec, execSync, execFileSync} = require('child_process');

// const broadcastService = new BroadcastService();
// const repeatService = new RepeatService(broadcastService);
// const sendService = new SendService();
// const fileService = new FileService();
// const genericService = new GenericService(10);

// const factory = new Factory(
//   broadcastService,
//   sendService,
//   StatusService,
//   repeatService,
//   ReportService,
//   genericService,
//   fileService,
// );

// let file;
// let filename;

process.stdin.resume() // so the program will not close instantly
if (!fs.existsSync(`${process.cwd()}/attachments`)) {
  fs.mkdirSync(`${process.cwd()}/attachments`)
}
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

async function listen(message) {
  try {
    // TODO fix the parseMessage function so it can include control messages
    // TODO add a parseMessage that can get the important parts and leave out recipients
    // Parses an incoming message and returns an object with command, argument, vGroupID and Sender fields
    const parsedMessage = bot.parseMessage(message)
    if (!parsedMessage) {
      await writer.writeFile(message)
      return
    }

    logger.debug('New incoming Message:', parsedMessage)
    let wickrUser
    let {
      command,
      argument,
      userEmail,
      vgroupid,
      convotype,
      msgtype,
      file,
      filename,
    } = parsedMessage
    if (command !== undefined) {
      command = command.toLowerCase().trim()
    }
    if (!command) {
      logger.debug('Command is empty!')
      // writer.writeFile(message);
    }
    // TODO what's the difference between full message and message
    const messageReceived = parsedMessage.message
    const vGroupID = vgroupid
    const convoType = convotype
    const messageType = msgtype
    const personalVGroupID = ''

    file = '' + file
    filename = '' + filename

    logger.debug('FILENAME bcast' + filename)
    logger.debug('FILE bcast' + file)
    logger.debug(`convoType=${convoType}`)
    // Go back to dev toolkit and fix
    /*
    if(convoType === 'personal') {
      personalVGroupID = vGroupID;
    } else {
      writer.writeFile(message);
      return;
    }
    */

    let user = bot.getUser(userEmail) // Look up user by their wickr email

    if (user === undefined) {
      // Check if a user exists in the database
      wickrUser = new WickrUser(userEmail, {
        message,
        vGroupID,
        personalVGroupID,
        command: '',
        argument: '',
        currentState,
      })
      user = bot.addUser(wickrUser) // Add a new user to the database
    }
    logger.debug('user:', user)

    if (!fs.existsSync(`${process.cwd()}/files/${userEmail}`)) {
      fs.mkdirSync(`${process.cwd()}/files/${userEmail}`)
    }

    const broadcastService = new BroadcastService(user)
    const repeatService = new RepeatService(broadcastService, user)
    const sendService = new SendService(user)
    const fileService = new FileService(user)
    const genericService = new GenericService(10, user)

    const factory = new Factory(
      broadcastService,
      sendService,
      StatusService,
      repeatService,
      ReportService,
      genericService,
      fileService
    )

    // Send the location as an acknowledgement
    //
    // TODO create a pre-admin factory method with all the commands that are pre-admin
    if (messageType === 'location') {
      // acknowledges all messages sent to user
      const userEmailString = `${userEmail}`
      const obj = {}
      obj.location = {
        latitude: parsedMessage.latitude,
        longitude: parsedMessage.longitude,
      }
      const statusMessage = JSON.stringify(obj)
      logger.debug(`location statusMessage=${statusMessage}`)
      genericService.setMessageStatus('', userEmailString, '3', statusMessage)
      user.currentState = State.NONE
      return
    }

    if (command === '/version') {
      const obj = Version.execute()
      WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply)
      user.currentState = State.NONE
      return
    }

    if (command === '/ack') {
      const userEmailString = `${userEmail}`
      genericService.setMessageStatus('', userEmailString, '3', '')
      user.currentState = State.NONE
      return
    }

    if (webAppEnabled) {
      webAppString =
        '*Web App Commands*\n' +
        '/panel : displays the link and token to the web user interface\n\n'
    }

    // TODO  put this in it's own command
    if (command === '/help') {
      const helpString =
        '*Messages Commands*\n' +
        '/send <Message> : To send a broadcast message to a given file of user hashes or usernames\n' +
        'To save a file of usernames or user hashes - Click the + sign and share the file with the bot\n' +
        '/broadcast <Message> : To send a broadcast message to the network or security groups\n' +
        'To broadcast a file - Click the + sign and share the file with the bot\n' +
        'To broadcast a voice memo - Click the microphone button and send a voice memo to the bot\n' +
        '/ack : To acknowledge a broadcast message \n' +
        '/messages : To get a text file of all the messages sent to the bot\n' +
        '/status : To get the status of a broadcast message\n' +
        '/report : To get a CSV file with the status of each user for a broadcast message\n' +
        '/abort : To abort a broadcast or send that is currently in progress\n\n' +
        `${webAppString}` +
        '*Admin Commands*\n' +
        '%{adminHelp}\n' +
        '*Other Commands*\n' +
        '/help : Show help information\n' +
        '/version : Get the version of the integration\n' +
        '/cancel : To cancel the last operation and enter a new command\n' +
        '/files : To get a list of saved files available for the /send command\n' +
        '/delete : To delete a file that was previously made available for the /send command\n' +
        '/groups : To get a list of security groups you can broadcast a message to\n'
      const reply = bot.getAdminHelp(helpString)
      logger.debug(`vgroupID in help:${vGroupID}`)
      // const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      const sMessage = APIService.sendRoomMessage(vGroupID, reply)
      logger.debug(sMessage)
      user.currentState = State.NONE
      return
    }

    if (!parsedMessage.isAdmin) {
      const reply = `Hey this bot is just for announcements and can't respond to you personally, or ${userEmail} is not authorized to use this bot. If you have a question, please get a hold of us a support@wickr.com or visit us a support.wickr.com. Thanks, Team Wickr`
      const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply)
      logger.debug({ sMessage })
      writer.writeFile(message)
      return
    }

    // TODO move this elsewhere?
    if (command === '/messages') {
      const path = `${process.cwd()}/attachments/messages.txt`
      WickrIOAPI.cmdSendRoomAttachment(vGroupID, path, path)
      user.currentState = State.NONE
      return
    }

    if (webAppEnabled && command === '/panel') {
      // Check if this user is an administrator
      // var adminUser = bot.myAdmins.getAdmin(userEmail);
      // scope this conditional down further

      // if (adminUser === undefined) {
      //   let reply = 'Access denied: ' + userEmail + ' is not authorized to broadcast!'
      //   var sMessage = APIService.sendRoomMessage(vGroupID, reply);
      //   return
      // }
      let host
      if (HTTPS_CHOICE.value === 'yes') {
        host = `https://${WEBAPP_HOST.value}`
      } else {
        host = `http://${WEBAPP_HOST.value}`
      }
      // generate a random auth code for the session
      // store it in a globally accessable store

      const random = generateRandomString(24)
      client_auth_codes[userEmail] = random
      // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk
      // send token in url, used for calls to receive data, send messages
      const token = jwt.sign(
        {
          email: userEmail,
          session: random,
          host: host,
          port: BOT_PORT.value,
        },
        BOT_AUTH_TOKEN.value,
        { expiresIn: '1800s' }
      )

      const reply = encodeURI(`${host}:${WEBAPP_PORT.value}/?token=${token}`)
      APIService.sendRoomMessage(vGroupID, reply)
      return
    }

    // const messageService = new MessageService(messageReceived, userEmail, argument, command, currentState, vGroupID, file, filename);
    const messageService = new MessageService(
      messageReceived,
      userEmail,
      argument,
      command,
      user.currentState,
      vGroupID,
      file,
      filename,
      user
    )
    // TODO is this JSON.stringify necessary??
    // How to deal with duplicate files??

    // TODO parse argument better??

    const obj = factory.execute(messageService)
    logger.debug(`obj${obj}`)
    if (obj.reply) {
      logger.debug('Object has a reply')
      WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply)
    }
    user.currentState = obj.state
  } catch (err) {
    logger.error(err)
    logger.error('Got an error')
  }
}

function generateRandomString(length) {
  let text = ''
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

main()
