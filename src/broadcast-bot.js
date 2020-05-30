
import fs from 'fs';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import jwt from "jsonwebtoken"
import startServer from './server';
import strings from './strings';
import {
  bot,
  WickrUser,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
  BOT_KEY,
  BOT_PORT,
  BOT_GOOGLE_MAPS,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  WickrIOAPI,
  getLastID,
  cronJob,
} from './helpers/constants';

// const pkgjson = require('./package.json');
import writer from './helpers/message-writer.js'
// import logger from './src/logger'
// const WhitelistRepository = require('./src/helpers/whitelist');
import Version from './commands/version'
import FileHandler from './helpers/file-handler'
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

let currentState;
let job;
let verifyUsersMode

// need to be able to debug and lint for syntax errors
//
// Web interface definitions
// 
process.stdin.resume(); //so the program will not close instantly

// const {exec, execSync, execFileSync} = require('child_process');



const fileHandler = new FileHandler();
// const whitelist = new WhitelistRepository(fs);
const broadcastService = new BroadcastService();
const repeatService = new RepeatService(broadcastService);
const sendService = new SendService();


const factory = new Factory(
  broadcastService,
  sendService,
  StatusService,
  repeatService,
  ReportService,
  GenericService
);

let file;
let filename;

process.stdin.resume(); // so the program will not close instantly
if (!fs.existsSync(`${process.cwd()}/attachments`)) {
  fs.mkdirSync(`${process.cwd()}/attachments`);
}
if (!fs.existsSync(`${process.cwd()}/files`)) {
  fs.mkdirSync(`${process.cwd()}/files`);
}

async function exitHandler(options, err) {
  try {
    const closed = await bot.close();
    if (err || options.exit) {
      logger.error('Exit reason:', err);
      process.exit();
    } else if (options.pid) {
      process.kill(process.pid);
    }
  } catch (err) {
    logger.error(err);
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }));
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }));

//TODO clear these values!
//TODO make these user variables??
var securityGroupFlag = false;
var securityGroupsToSend = [];
var securityGroups = [];
var repeatFlag = false;
var voiceMemoFlag = false;;
var fileFlag = false;
var cronInterval;
var displayName;
var askForAckFlag = false;
var messagesForReport = []; // unused
// catches uncaught exceptions
// TODO make this more robust of a catch
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));



async function main() {
  try {
    var status = await bot.start(WICKRIO_BOT_NAME.value)

    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start',
      });
    }

    // TODO set to true and send from a non admin and see what happens
    bot.setAdminOnly(false);

    // set the verification mode to true
    if (VERIFY_USERS.encrypted) {
      verifyUsersMode = WickrIOAPI.cmdDecryptString(VERIFY_USERS.value);
    } else {
      verifyUsersMode = VERIFY_USERS.value;
    }

    bot.setVerificationMode(verifyUsersMode);

    WickrIOAPI.cmdSetControl('cleardb', 'true');
    WickrIOAPI.cmdSetControl('contactbackup', 'false');
    WickrIOAPI.cmdSetControl('convobackup', 'false');
    WickrIOAPI.cmdSetControl('readreceipt', 'true');

    // Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen);


    if (
      BOT_AUTH_TOKEN.value != 'false' &&
      BOT_KEY.value != 'false' &&
      BOT_PORT.value != 'false'
    ) {
      // run server
      startServer()

    } else {
      console.log('If you wanted a web interface, the env variables not set properly. Check BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT')

    }
    // await bot.startListening(listen); //Passes a callback function that will receive incoming messages into the bot client
  } catch (err) {
    console.log(err);
  }
}

async function listen(message) {
  try {
    // TODO fix the parseMessage function so it can include control messages
    // TODO add a parseMessage that can get the important parts and leave out recipients
    // Parses an incoming message and returns an object with command, argument, vGroupID and Sender fields
    const parsedMessage = bot.parseMessage(message);
    if (!parsedMessage) {
      await writer.writeFile(message);
      return;
    }

    logger.debug('New incoming Message:', parsedMessage);
    let wickrUser;
    const fullMessage = parsedMessage.message;
    let { command } = parsedMessage;
    if (command !== undefined) {
      command = command.toLowerCase().trim();
    } if (!command) {
      logger.debug('Command is empty!');
      // writer.writeFile(message);
    }
    // TODO what's the difference between full message and message
    const messageReceived = parsedMessage.message;
    const { argument } = parsedMessage;
    const { userEmail } = parsedMessage;
    const vGroupID = parsedMessage.vgroupid;
    const convoType = parsedMessage.convotype;
    const messageType = parsedMessage.msgtype;
    const personalVGroupID = '';
    logger.debug(`convoType=${convoType}`);
    // Go back to dev toolkit and fix
    /*
    if(convoType === 'personal') {
      personalVGroupID = vGroupID;
    } else {
      writer.writeFile(message);
      return;
    }
    */
    // Send the location as an acknowledgement

    // TODO create a pre-admin factory method with all the commands that are pre-admin
    if (messageType === 'location') {
      // acknowledges all messages sent to user
      const userEmailString = `${userEmail}`;
      const obj = {};
      obj.location = {
        latitude: parsedMessage.latitude,
        longitude: parsedMessage.longitude,
      };
      const statusMessage = JSON.stringify(obj);
      logger.debug(`location statusMessage=${statusMessage}`);
      GenericService.setMessageStatus('', userEmailString, '3', statusMessage);
      return;
    }

    if (command === '/version') {
      const obj = Version.execute();
      const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply);
      return;
    }

    if (command === '/ack') {
      const userEmailString = `${userEmail}`;
      GenericService.setMessageStatus('', userEmailString, '3', '');
      return;
    }

    // TODO  put this in it's own command
    if (command === '/help') {
      const helpString = '*Messages Commands*\n'
        + '/send <Message> : To send a broadcast message to a given file of user hashes or usernames\n'
        + 'To save a file of usernames or user hashes - Click the + sign and share the file with the bot\n'
        + '/broadcast <Message> : To send a broadcast message to the network or security groups\n'
        + 'To broadcast a file - Click the + sign and share the file with the bot\n'
        + 'To broadcast a voice memo - Click the microphone button and send a voice memo to the bot\n'
        + '/ack : To acknowledge a broadcast message \n'
        + '/messages : To get a text file of all the messages sent to the bot\n'
        + '/status : To get the status of a broadcast message\n'
        + '/report : To get a CSV file with the status of each user for a broadcast message\n\n'
        + '*Admin Commands*\n'
        + '%{adminHelp}\n'
        + '*Other Commands*\n'
        + '/help : Show help information\n'
        + '/version : Get the version of the integration\n'
        + '/cancel : To cancel the last operation and enter a new command\n'
        + '/files : To get a list of saved files available for the /send command';
      const reply = bot.getAdminHelp(helpString);
      logger.debug(`vgroupID in help:${vGroupID}`);
      // const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      const sMessage = APIService.sendRoomMessage(vGroupID, reply);
      logger.debug(sMessage);
      return;
    }

    if (!parsedMessage.isAdmin) {
      const reply = `Hey this bot is just for announcements and can't respond to you personally, or ${userEmail} is not authorized to use this bot. If you have a question, please get a hold of us a support@wickr.com or visit us a support.wickr.com. Thanks, Team Wickr`;
      const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      logger.debug({ sMessage });
      writer.writeFile(message);
      return;
    }

    // TODO move this elsewhere?
    if (command === '/messages') {
      const path = `${process.cwd()}/attachments/messages.txt`;
      const uMessage = WickrIOAPI.cmdSendRoomAttachment(vGroupID, path, path);
      return;
    }

    let user = bot.getUser(userEmail); // Look up user by their wickr email

    if (user === undefined) { // Check if a user exists in the database
      wickrUser = new WickrUser(userEmail, {
        index: 0,
        vGroupID,
        personalVGroupID,
        command: '',
        argument: '',
        confirm: '',
        type: '',
      });
      user = bot.addUser(wickrUser); // Add a new user to the database
    }

    logger.debug('user:', user);


    if (command === '/map') {
      let last_id = getLastID()
      let locatedusers = false
      // request last broadcast requested with location
      // or 

      // request last broadcast status with X number of user responses
      if (!argument) {
        reply = 'need /map <number to retrieve>'
        return APIService.sendRoomMessage(vGroupID, reply);
      }
      // get message status with locations
      const messageStatus = JSON.parse(APIService.getMessageStatus(last_id.toString(), 'full', String(0), String(argument)))
      // create a simple object to store data
      console.log({ messageStatus })
      let locations = []
      locations[messageStatus.messageID] = {}
      let link = `https://maps.googleapis.com/maps/api/staticmap?key=${BOT_GOOGLE_MAPS.value}&size=700x400&markers=color:blue`
      if (messageStatus.length > 0) {
        // only get status' with location acked
        // display map of all users who have acknowledged with location
        messageStatus.map(user => {
          if (user?.statusMessage?.location) {
            console.log("located a user")
            locatedusers = true
            let { latitude, longitude } = user?.status_message?.location
            locations[messageStatus.messageID][user.user] = {}
            locations[messageStatus.messageID][user.user].location = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
            locations[messageStatus.messageID][user.user].latitude = latitude
            locations[messageStatus.messageID][user.user].longitude = longitude
            link += `|label:${user.user}|${latitude},${longitude}`
          }
        })
        locations[messageStatus.messageID] = link
        // console.log({ link })
        if (locatedusers) {
          var sMessage = APIService.sendRoomMessage(vGroupID, link);
        } else {
          var sMessage = APIService.sendRoomMessage(vGroupID, "no location for the replied users");

        }

      } else {
        if (statusMessage.location) {
          locatedusers = true
          let { latitude, longitude } = user?.status_message?.location
          locations[messageStatus.messageID][user.user] = {}
          locations[messageStatus.messageID][user.user].location = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
          locations[messageStatus.messageID][user.user].latitude = latitude
          locations[messageStatus.messageID][user.user].longitude = longitude
          link += `|label:${user.user}|${latitude},${longitude}`
          return messageStatus
        } else {
          return "no location for the replied user"
        }
      }
      return
    }

    if (command === '/panel') {
      // Check if this user is an administrator
      // var adminUser = bot.myAdmins.getAdmin(userEmail);
      // scope this conditional down further

      // if (adminUser === undefined) {
      //   let reply = 'Access denied: ' + userEmail + ' is not authorized to broadcast!'
      //   var sMessage = APIService.sendRoomMessage(vGroupID, reply);
      //   return
      // }
      // generate a random auth code for the session
      // store it in a globally accessable store

      var random = generateRandomString(24);
      client_auth_codes[userEmail] = random;
      // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk 
      // send token in url, used for calls to receive data, send messages
      const token = jwt.sign({
        'email': userEmail,
        'session': random,
      }, BOT_AUTH_TOKEN.value, { expiresIn: '1800s' });

      // what will the deploy env be
      var reply = encodeURI(`localhost:4545/?token=${token}`)
      APIService.sendRoomMessage(vGroupID, reply);
      return
    }

    const messageService = new MessageService(messageReceived, userEmail, argument, command, currentState, vGroupID);

    // TODO is this JSON.stringify necessary??
    // How to deal with duplicate files??
    if (currentState === State.FILE_TYPE) {
      currentState = State.NONE;
      const type = parsedMessage.message.toLowerCase();
      let fileAppend = '';
      logger.debug(`Here is the filetype message${type}`);
      if (type === 'u' || type === 'user') {
        fileAppend = '.user';
      } else if (type === 'h' || type === 'hash') {
        fileAppend = '.hash';
      } else if (type === 's' || type === 'send') {
        // TODO fix this
        // sendFile.execute();
        command = '/broadcast';
        const obj = factory.execute(currentState, command, argument, parsedMessage.message, userEmail);
        if (obj.reply) {
          logger.debug('Object has a reply');
          const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply);
        }
        currentState = obj.state;
      } else {
        const reply = 'Input not recognized please reply with (u)ser, (h)ash, or (s)end.';
        const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        currentState = State.FILE_TYPE;
      }
      if (fileAppend) {
        logger.debug(`Here is file info${file}`);
        const cp = await fileHandler.copyFile(file.toString(), `${process.cwd()}/files/${filename.toString()}${fileAppend}`);
        logger.debug(`Here is cp:${cp}`);
        if (cp) {
          const reply = `File named: ${filename} successfully saved to directory.`;
          const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        } else {
          const reply = `Error: File named: ${filename} not saved to directory.`;
          const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        }
      }
    } else {
      // TODO parse argument better??
      let obj;
      if (parsedMessage.file) {
        obj = factory.file(parsedMessage.file, parsedMessage.filename);
        file = parsedMessage.file;
        filename = parsedMessage.filename;
      } else {
        obj = factory.execute(messageService);
        logger.debug(`obj${obj}`);
      }
      if (obj.reply) {
        logger.debug('Object has a reply');
        const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply);
      }
      currentState = obj.state;
    }

  } catch (err) {
    logger.error(err);
    logger.error('Got an error');
  }
}

function generateRandomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}



main()
