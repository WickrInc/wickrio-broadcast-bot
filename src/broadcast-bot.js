
import fs from 'fs';
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import jwt from "jsonwebtoken"
import startServer from './server';
import strings from './strings';
import {
  bot,
  WickrIOAPI,
  WickrUser,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
  BOT_KEY,
  BOT_PORT,
  BOT_GOOGLE_MAPS,
  WICKRIO_BOT_NAME,
  VERIFY_USERS,
  cronJob,
} from './helpers/constants';
let currentState;
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
const statusService = new StatusService();
const repeatService = new RepeatService(broadcastService);
const sendService = new SendService();
const reportService = new ReportService();

const factory = new Factory(
  broadcastService,
  sendService,
  statusService,
  repeatService,
  reportService,
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
  console.log('Entering main!');
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
    // Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen);


    if (BOT_AUTH_TOKEN.value, BOT_KEY.value, BOT_PORT.value) {
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
    /*
     * Parses an incoming message and returns and object with command,
     * argument, vGroupID and Sender fields
     */
    // const last_id = JSON.parse(fs.readFileSync('last_id.json'))
    // TODO fix the parseMessage function so it can include control messages
    // TODO add a parseMessage that can get the important parts and leave out recipients
    // Parses an incoming message and returns an object with command, argument, vGroupID and Sender fields


    var parsedMessage = bot.parseMessage(message);

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

    // Send the location as an acknowledgement

    // TODO create a pre-admin factory method with all the commands that are pre-admin

    // 

    //       // Do not support interaction with Rooms or Groups 
    if (convoType !== 'personal') {
      var reply = strings["one-to-one"];
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      return;
    }

    // if (!isAdmin) {
    //   var reply = strings["not-authorized"];
    //   var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    //   logger.debug(sMessage);
    //   return;
    // }


    //       var user = bot.getUser(userEmail); //Look up user by their wickr email

    //       if (user === undefined) { //Check if a user exists in the database
    //         wickrUser = new WickrUser(userEmail, {
    //           index: 0,
    //           vGroupID: vGroupID,
    //           personal_vGroupID: personal_vGroupID,
    //           command: "",
    //           argument: "",
    //           confirm: "",
    //           type: ""
    //         });
    //         user = bot.addUser(wickrUser); //Add a new user to the database
    //       }
    //       logger.debug('user:', user)

    // =======
    if (command === '/version') {
      const obj = Version.execute();
      const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, obj.reply);
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
    }


    if (command === '/ack') {
      const userEmailString = `${userEmail}`;
      GenericService.setMessageStatus('', userEmailString, '3', '');
      return;
    }

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
      // >>>>>>> master:broadcast-bot.js
      return;
    }
    if (command === '/map') {
      let last_id = get_LastID()
      // request last broadcast requested with location
      // or 

      // request last broadcast status with X number of user responses
      if (!argument) {
        reply = 'need /map <number to retrieve>'
        uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      // get message status with locations
      const messageStatus = JSON.parse(WickrIOAPI.cmdGetMessageStatus(last_id.toString(), 'full', String(0), String(argument)))
      // create a simple object to store data
      let locations = []
      locations[messageStatus.messageID] = {}
      let link = `https://maps.googleapis.com/maps/api/staticmap?key=${BOT_GOOGLE_MAPS.value}&size=700x400&markers=color:blue`
      if (messageStatus.length > 0) {
        // only get status' with location acked
        // display map of all users who have acknowledged with location
        messageStatus.map(user => {
          let { latitude, longitude } = JSON.parse(user.status_message).location
          locations[messageStatus.messageID][user.user] = {}
          locations[messageStatus.messageID][user.user].location = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
          locations[messageStatus.messageID][user.user].latitude = latitude
          locations[messageStatus.messageID][user.user].longitude = longitude
          link += `|label:${user.user}|${latitude},${longitude}`
        })
        locations[messageStatus.messageID] = link
        console.log({ link })
        var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, link);

      } else {
        return messageStatus
      }
    }

    if (command === '/panel') {
      // Check if this user is an administrator
      var adminUser = bot.myAdmins.getAdmin(user.userEmail);
      // scope this conditional down further
      if (adminUser === undefined) {
        return res.statusCode(401).send('Access denied: ' + user.userEmail + ' is not authorized to broadcast!');
      }

      // generate a random auth code for the session
      // store it in a globally accessable store


      var random = generateRandomString(24);
      client_auth_codes[user.userEmail] = random;
      // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk 
      // send token in url, used for calls to receive data, send messages
      const token = jwt.sign({
        'email': user.userEmail,
        'session': random,
      }, BOT_AUTH_TOKEN.value, { expiresIn: '1800s' });

      // what will the deploy env be
      var reply = encodeURI(`localhost:4545/?token=${token}`)
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      user.confirm = '';
      logger.debug(sMessage);
    }

    if (command === '/status') {
      logger.debug(":" + argument + ":");
      //check argument here!
      //args = argument.split(' ');
      if (argument === '') {
        var messageIdEntries = getMessageEntries(userEmail, 5);
        var reply = "";
        if (messageIdEntries.length < 1) {
          reply = strings["noPrevious"];
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          return;
        }
        var length = Math.min(messageIdEntries.length, 5);
        var contentData;
        var index = 1;
        var messageList = [];
        var messageString = "";
        for (var i = 0; i < messageIdEntries.length; i++) {
          contentData = WickrIOAPI.cmdGetMessageIDEntry(messageIdEntries[i].message_id);
          var contentParsed = JSON.parse(contentData);
          messageList.push(contentParsed.message);
          messageString += '(' + index++ + ') ' + contentParsed.message + "\n";
        }
        reply = strings["whichMessage"].replace("%{length}", length).replace("%{messageList}", messageString);
        //var uMessage = replyWithButtons(vGroupID, reply, messageList);
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        user.confirm = 'askMessageId';
        //TODO keep working on this!!
      } else if (isNaN(argument)) {
        var reply = strings["enterID"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      }
      //fix later~
      //getStatus(argument, "summary");
    }

    if (command === '/report') {
      var messageIdEntries = getMessageEntries(userEmail, 5);
      var reply = "";
      if (messageIdEntries.length < 1) {
        reply = strings["noPrevious"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      var length = Math.min(messageIdEntries.length, 5);
      var contentData;
      var index = 1;
      var messageString = "";
      var messageList = [];
      //for (var entry of messageIdEntries) {
      //TODO put this into the strings file
      for (var i = 0; i < messageIdEntries.length; i++) {
        contentData = WickrIOAPI.cmdGetMessageIDEntry(messageIdEntries[i].message_id);
        var contentParsed = JSON.parse(contentData);
        messageString += '(' + index++ + ')' + contentParsed.message + '\n';
        messageList.push(contentParsed.message);
      }
      reply = strings["whichReport"].replace("%{length}", length).replace("%{messageList}", messageString);
      //var uMessage = replyWithButtons(vGroupID, reply, messageList);
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      user.confirm = 'idForReport';
    }

    if (command === '/abort') {
      logger.debug(":" + argument + ":");
      //check argument here!
      //args = argument.split(' ');
      if (argument === '') {
        var messageIdEntries = getMessageEntries(userEmail, 5);
        var reply = "";
        if (messageIdEntries.length < 1) {
          reply = strings["noPrevious"];
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          return;
        }
        var length = Math.min(messageIdEntries.length, 5);
        var contentData;
        var index = 1;
        var messageList = [];
        var messageString = "";
        for (var i = 0; i < messageIdEntries.length; i++) {
          contentData = WickrIOAPI.cmdGetMessageIDEntry(messageIdEntries[i].message_id);
          var contentParsed = JSON.parse(contentData);
          messageList.push(contentParsed.message);
          messageString += '(' + index++ + ') ' + contentParsed.message + "\n";
        }
        reply = strings["whichMessage"].replace("%{length}", length).replace("%{messageList}", messageString);
        //var uMessage = replyWithButtons(vGroupID, reply, messageList);
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        user.confirm = 'idForAbort';
        //TODO keep working on this!!
      } else if (isNaN(argument)) {
        var reply = strings["enterID"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      }
      return;
    }

    if (!parsedMessage.isAdmin) {
      const reply = "Hey, this bot is just for announcements and can't respond to you personally. If you have a question, please get a hold of us a support@wickr.com or visit us a support.wickr.com. Thanks, Team Wickr";
      const sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      logger.debug(sMessage);
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

//TODO get target inside function
// function repeatMessage(broadcast, user, vGroupID, messageID, userEmail, target) {
//   //Send first repeated message before starting the cronJob
//   logger.debug('cronInterval:', cronInterval)
//   var bMessage;
//   var currentDate = new Date();
//   var jsonDateTime = currentDate.toJSON();
//   var broadcastMsgToSend = broadcast + "\n\nBroadcast message sent by: " + userEmail;
//   logger.debug("Security group flag is: " + securityGroupFlag);
//   if (securityGroupFlag) {
//     messageID = "" + messageID;
//     bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(broadcastMsgToSend, securityGroupsToSend, "", "", messageID);
//   } else {
//     messageID = "" + messageID;
//     bMessage = WickrIOAPI.cmdSendNetworkMessage(broadcastMsgToSend, "", "", messageID);
//   }
//   logger.debug(bMessage)


//   // send message
//   var reply = strings["repeatMessageSent"].replace("%{count}", (user.count + 1));
//   var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
//   user.count += 1;
//   cronJob(job, cronInterval, user, broadcast, securityGroupFlag, askForAckFlag, securityGroupsToSend, userEmail, target);
// }

function getMessageEntries(userEmail, max) {
  var messageIdEntries = []
  // need to dynamically get last x records, what if there are over 1000 messages

  var tableDataRaw = WickrIOAPI.cmdGetMessageIDTable("0", "1000");
  var tableData = JSON.parse(tableDataRaw);
  for (var i = tableData.length - 1; i >= 0; i--) {
    var entry = tableData[i];
    logger.debug("entry: " + entry);
    //logger.debug("entry keys: " + Object.keys(entry));
    if (entry.sender === userEmail) {
      messageIdEntries.push(entry);
    }
    if (messageIdEntries.length >= max) {
      break;
    }
  }
  return messageIdEntries;
}

//TODO add these strings to file
// function getStatus(messageID, type, async) {
//   messageID = "" + messageID;
//   var statusData;
//   try {
//     statusData = WickrIOAPI.cmdGetMessageStatus(messageID, type, "0", "1000");
//   } catch (err) {
//     if (async) {
//       var returnObj = {
//         statusString: "No data found for that message",
//         complete: true
//       };
//       return returnObj;
//     } else {
//       return "No data found for that message";
//     }
//   }
//   var messageStatus = JSON.parse(statusData);
//   var statusString;

//   statusString = strings["messageStatus"].replace("%{num2send}", messageStatus.num2send).replace("%{sent}", messageStatus.sent).replace("%{acked}", messageStatus.acked).replace("%{pending}", messageStatus.pending).replace("%{failed}", messageStatus.failed).replace("%{read}", messageStatus.read).replace("%{aborted}", messageStatus.aborted).replace("%{ignored}", messageStatus.ignored);
//   if (messageStatus.ignored !== undefined) {
//     statusString = statusString + strings["messageStatusIgnored"].replace("%{ignored}", messageStatus.ignored);
//   }

//   logger.debug("here is the message status" + statusString);
//   if (async) {
//     var complete = messageStatus.pending === 0;
//     var returnObj = {
//       statusString: statusString,
//       complete: complete
//     };
//     return returnObj;
//   } else {
//     return statusString;
//   }
// }

// function writeToMessageIdDB(messageId, sender, target, dateSent, messageContent) {
//   logger.debug("inside~writeToMessageIdDB");
//   WickrIOAPI.cmdAddMessageID(messageId, sender, target, dateSent, messageContent);
// }

// function setMessageStatus(messageId, userId, status, statusMessage) {
//   var reply = WickrIOAPI.cmdSetMessageStatus(messageId, userId, status, statusMessage);
//   // var userArray = [userId];
//   // var uMessage = WickrIOAPI.cmdSend1to1Message(userArray, reply);
// }

function get_LastID() {
  try {
    let lastID
    if (fs.existsSync('last_id.json')) {
      var data = fs.readFileSync('last_id.json');
      logger.debug("is the data okay: " + data);
      lastID = JSON.parse(data);
    } else {
      lastID = '1'
      fs.writeFile('last_id.json', lastID, (err) => {
        //Fix this 
        if (err) throw err;
        logger.trace("Current Message ID saved in file");
      });
    }
    logger.debug("This is the id: " + lastID);
    return lastID;
  } catch (err) {
    logger.error(err);
  }
}

// function getCSVReport(messageId) {
//   var inc = 0;
//   var csvArray = [];
//   while (true) {
//     var statusData = WickrIOAPI.cmdGetMessageStatus(messageId, "full", "" + inc, "1000");
//     var messageStatus = JSON.parse(statusData);
//     for (var entry of messageStatus) {
//       var statusMessageString = "";
//       var statusString = "";

//       var sentDateString = "";
//       var readDateString = "";
//       if (entry.sent_datetime !== undefined)
//         sentDateString = entry.sent_datetime;
//       if (entry.read_datetime !== undefined)
//         readDateString = entry.read_datetime;
//       switch (entry.status) {
//         case 0:
//           statusString = "pending";
//           break;
//         case 1:
//           statusString = "sent";
//           break;
//         case 2:
//           statusString = "failed";
//           statusMessageString = entry.status_message;
//           break;
//         case 3:
//           statusString = "acked";
//           if (entry.status_message !== undefined) {
//             var obj = JSON.parse(entry.status_message);
//             if (obj['location'] !== undefined) {
//               var latitude = obj['location'].latitude;
//               var longitude = obj['location'].longitude;
//               statusMessageString = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
//             } else {
//               statusMessageString = entry.status_message;
//             }
//           }
//           break;
//         case 4:
//           statusString = "ignored";
//           statusMessageString = entry.status_message;
//           break;
//         case 5:
//           statusString = "aborted";
//           statusMessageString = entry.status_message;
//           break;
//         case 6:
//           statusString = "read";
//           statusMessageString = entry.status_message;
//           break;
//       }

//       csvArray.push(
//         {
//           user: entry.user,
//           status: statusString,
//           statusMessage: statusMessageString,
//           sentDate: sentDateString,
//           readDate: readDateString
//         });
//     }
//     if (messageStatus.length < 1000) {
//       break;
//     }
//     inc++;
//   }
//   var now = new Date();
//   var dateString = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear() + "_" + now.getHours() + "_" + now.getMinutes() + "_" + now.getSeconds();

//   var path = process.cwd() + "/attachments/report-" + dateString + ".csv";
//   writeCSVReport(path, csvArray);
//   return path;
// }

// function writeCSVReport(path, csvArray) {
//   var csvWriter = createCsvWriter({
//     path: path,
//     header: [
//       { id: 'user', title: 'USER' },
//       { id: 'status', title: 'STATUS' },
//       { id: 'statusMessage', title: 'MESSAGE' },
//       { id: 'sentDate', title: 'SENT' },
//       { id: 'readDate', title: 'READ' }
//     ]
//   });
//   csvWriter.writeRecords(csvArray)
//     .then(() => {
//       logger.debug('...Done');
//     });
// }

function generateRandomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}



main()
