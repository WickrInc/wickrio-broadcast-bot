'use strict';

const fs = require('fs');
const {exec, execSync, execFileSync} = require('child_process');
const WickrIOAPI = require('wickrio_addon');
const WickrIOBotAPI = require('wickrio-bot-api');
const WickrUser = WickrIOBotAPI.WickrUser;
const bot = new WickrIOBotAPI.WickrIOBot();
const pkgjson = require('./package.json');
var CronJob = require('cron').CronJob;
var log4js = require('log4js');
var logger = log4js.getLogger();
logger.level = 'debug';
var createCsvWriter = require('csv-writer').createObjectCsvWriter;
var whitelisted_users, job;

process.stdin.resume(); //so the program will not close instantly
if(!fs.existsSync(process.cwd() + "/attachments")) {
  fs.mkdirSync(process.cwd() + "/attachments");
}
async function exitHandler(options, err) {
  try {
    var closed = await bot.close();
    if (err || options.exit) {
      console.log("Exit reason:", err);
      process.exit();
    } else if (options.pid) {
      process.kill(process.pid);
    }
  } catch (err) {
    console.log(err);
  }
}

//catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, {exit: true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {pid: true}));
process.on('SIGUSR2', exitHandler.bind(null, {pid: true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit: true}));

//TODO clear these values!
//TODO make these user variables??
var securityGroupFlag = false;
var securityGroupsToSend = [];
var securityGroups = [];
var repeatFlag = false;
var voiceMemoFlag = false;;
var fileFlag = false;
var cronInterval;
var messageIdEntries = [];
var displayName;
var askForAckFlag = false;

async function main() {
  try {
    var tokens = JSON.parse(process.env.tokens);
    var status = await bot.start(tokens.WICKRIO_BOT_NAME.value)
    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start'
      });
    }

    if (tokens.WHITELISTED_USERS.encrypted) {
      whitelisted_users = WickrIOAPI.cmdDecryptString(tokens.WHITELISTED_USERS.value);
    } else {
      whitelisted_users = tokens.WHITELISTED_USERS.value;
    }
    whitelisted_users = whitelisted_users.split(',');

    // Make sure there are no white spaces on the whitelisted users
    for(var i = 0; i < whitelisted_users.length; i++){
      whitelisted_users[i] = whitelisted_users[i].trim();
    }

    await bot.startListening(listen); //Passes a callback function that will receive incoming messages into the bot client
  } catch (err) {
    console.log(err);
  }
}

function listen(message) {
  try {
    var parsedMessage = bot.parseMessage(message); //Parses an incoming message and returns and object with command, argument, vGroupID and Sender fields
    if (!parsedMessage) {
      return;
    }
    logger.debug('New incoming Message:', parsedMessage);
    var wickrUser;
    var fullMessage = parsedMessage.message;
    var command = parsedMessage.command;
    if (command != undefined) {
        command = command.toLowerCase().trim();
    }
    var argument = parsedMessage.argument;
    var userEmail = parsedMessage.userEmail;
    var vGroupID = parsedMessage.vgroupid;
    var convoType = parsedMessage.convotype;
    var personal_vGroupID = "";

    //Go back to dev toolkit and fix
    if(convoType === 'personal')
      personal_vGroupID = vGroupID;

    if (command === '/ack') {
      //sets ack (3) of all messages sent to user
      var userEmailString = "" + userEmail;
      setMessageStatus("", userEmail, "3");//, "");
      return;
    }

    logger.debug("convoType=" + convoType);

    // Do not support interaction with Rooms or Groups 
    if(convoType !== 'personal') {
      var reply = "Sorry, the Broadcast Bot currently only supports commands vi 1:1 conversations only!";
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      return;
    }
 
    if (!verifyUser(userEmail)) {
      var reply = "Sorry, you are not authorized to send broadcast messages. If you think this is a mistake please contact your system administrator."
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      logger.debug(sMessage);
      return;
    }

    if (command === '/version') {
      var reply = "*Versions*\nIntegration: " + pkgjson.version +
                            "\nWickrIO Addon: " + pkgjson.dependencies["wickrio_addon"] +
                            "\nWickrIO API: " + pkgjson.dependencies["wickrio-bot-api"] ;
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      return;
    }
    
    var user = bot.getUser(userEmail); //Look up user by their wickr email

    if (user === undefined) { //Check if a user exists in the database
      wickrUser = new WickrUser(userEmail, {
        index: 0,
        vGroupID: vGroupID,
        personal_vGroupID: personal_vGroupID,
        command: "",
        argument: "",
        confirm: "",
        type: ""
      });
      user = bot.addUser(wickrUser); //Add a new user to the database
    }
    logger.debug('user:', user)
    
    if (command === '/help') {
      var reply = "*Messaging Commands*\n" +
                  "/broadcast <Message> : to send a broadcast message\n" +
                  "To send a file as a broadcast message - Click the + sign and share the file with the bot\n" +
                  "To send a voice memo as a broadcast message - Click the microphone button and send a voice memo to the bot\n" +
                  "/ack  : To acknowledge a broadcast message \n" +
                  "/status : To get status of a broadcast message \n" +
                  "/report : To get a CSV file with the status of each user of a broadcast message \n" +
                  "/cancel : To cancel the last operation and enter a new command \n\n" + 
                  "*Admin Commands*\n" +
                  "/admin list : Get list of admin users \n" +
                  "/admin add <users> : Add one or more admin users \n" +
                  "/admin remove <users> : Remove one or more admin users \n\n" +
                  "*Other Commands*\n" +
                  "/help : Show help information";

      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      user.confirm = '';
      logger.debug(sMessage);
    }
    //TODO Should these be else if statements??
    if (command === '/broadcast') {
      logger.debug("argument:" + argument);
      var reply;
      var uMessage;
      if (! argument) {
        reply = "Usage: /broadcast <Message>\nPlease type the message you would like to send after the /broadcast";
        uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      user.broadcast = argument;
      reply = "Would you like to ask the recipients for an acknowledgement?"
      user.confirm = 'askForAck';
      uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    }

    if (command === '/status') {
      logger.debug(":" + argument + ":");
      //check argument here!
      //args = argument.split(' ');
      if (argument === ''){
        messageIdEntries = getMessageEntries(userEmail);
        var reply = "";
        if(messageIdEntries.length < 1){
          reply = "There are no previous messages to display";
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          return;
        }
        var length = Math.min(messageIdEntries.length, 5);
        reply = "Here are the past " + length + " broadcast message(s):\n";
        var contentData;
        var index = 1;
        //for (let entry of messageIdEntries) {
        for (var i = 0; i < messageIdEntries.length; i++){
          contentData = WickrIOAPI.cmdGetMessageIDEntry(messageIdEntries[i].message_id);
          var contentParsed = JSON.parse(contentData);
          reply += '(' + index++ + ') ' +  contentParsed.message + '\n';
        }
        reply += "Which message would you like to see the status of?";
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        user.confirm = 'askMessageId';
        //TODO keep working on this!!
      }else if (isNaN(argument)) {
        var reply = "Please enter a number for the messageID";
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      }
      //fix later~
      //getStatus(argument, "summary");
    }

    if (command === '/report') {
      messageIdEntries = getMessageEntries(userEmail);
      var reply = "";
      if(messageIdEntries.length < 1){
        reply = "There are no previous messages to display";
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      var length = Math.min(messageIdEntries.length, 5);
      reply = "Here are the past " + length + " broadcast message(s):\n";
      var contentData;
      var index = 1;
      //for (let entry of messageIdEntries) {
      for (var i = 0; i < messageIdEntries.length; i++){
        contentData = WickrIOAPI.cmdGetMessageIDEntry(messageIdEntries[i].message_id);
        var contentParsed = JSON.parse(contentData);
        reply += '(' + index++ + ')' +  contentParsed.message + '\n';
      }
      reply += "Which message would you like to receive a report of?";
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      user.confirm = 'idForReport';
      logger.debug("this is the path:" + process.cwd());
    }
    if (command === '/cancel') {
      user.confrim = '';
      var reply = "Previous command canceled, send a new command or enter /help for a list of commands."
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      securityGroupFlag =false;
      securityGroupsToSend = [];
      securityGroups = [];
      repeatFlag = false;
      voiceMemoFlag = false;;
      fileFlag = false;
      messageIdEntries = [];
      displayName = "";
      askForAckFlag = false;
      return;
    }
    // else if(command === '/directory'){
    //   logger.debug(directory)
    //   var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, directory);
    //   logger.debug(sMessage);
    // }

    // TODO check if user.confrim for flow!!
    if (command === '/admin') {
        var action = argument.toLowerCase().trim();
        logger.debug(action);
        if (action === 'list') {
            var userList = whitelisted_users.join('\n');
            var reply = "Current admins:\n" + userList;
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        } else if (action.startsWith("add")) {
            // Process the list of users to be added from the white list
            var values = action.split(' ');
            values.shift();
            if (values.length >= 1) {
                for(var i = 0; i < values.length; i++){
                    if (whitelisted_users.includes(values[i])) {
                        var reply = "Failed, current list of admins already contains " + values[i];
                        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
                        return;
                    }
                }

                // Send the initial response
                var userList = values.join('\n');
                var reply = "Going to add admins:\n" + userList;
                var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);

                // add the user(s) from the white list and update the config file
                for (var i = 0; i < values.length; i++) {
                    whitelisted_users.push( values[i] );
                }
                logger.debug(whitelisted_users);
                updateWhiteList();

                // Send a message to all the current white listed users
                var donereply = userEmail + " has added the following admins:\n" + userList;
                var uMessage = WickrIOAPI.cmdSend1to1Message(whitelisted_users, donereply);
            } else {
                var reply = "Command contains no user names to add!";
                var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            }
        } else if (action.startsWith("remove")) {
            // Process the list of users to be removed from the white list
            var values = action.split(' ');
            values.shift();
            if (values.length >= 1) {
                for(var i = 0; i < values.length; i++){
                    if (! whitelisted_users.includes(values[i])) {
                        var reply = "Failed, current list of admins does not contain " + values[i];
                        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
                        return;
                    }
                }

                // Send the initial response
                var userList = values.join('\n');
                var reply = "Going to delete admins:\n" + userList;
                var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);

                // Remove the user(s) from the white list and update the config file
                for (var i = 0; i < values.length; i++) {
                    whitelisted_users.splice( whitelisted_users.indexOf(values[i]), 1);
                }
                logger.debug(whitelisted_users);
                updateWhiteList();

                // Send a message to all the current white listed users
                var donereply = userEmail + " has removed the following admins:\n" + userList;
                var uMessage = WickrIOAPI.cmdSend1to1Message(whitelisted_users, donereply);
            } else {
                var reply = "Command contains no user names to remove!";
                var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            }
        } else {
            var reply = "Invalid /admin command, usage:\n/admin list|add <user(s)>|remove <user(s)>";
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        }
    }


    //TODO check if user.confrim for flow!!
    if (parsedMessage.file){
      var msg = "";
      if (parsedMessage.isVoiceMemo){
        msg = "Would you like to send this voice memo as a broadcast message?";
        user.confirm = 'sendVoiceMemo';
        user.command = '/voicememo';
        user.voiceMemoLocation = parsedMessage.file;
        user.voiceMemoDuration = parsedMessage.voiceMemoDuration;
      } else {
        msg = "Would you like to send file named: '" + parsedMessage.filename + "' as a broadcast message?";
        displayName = parsedMessage.filename;
        user.confirm = 'sendFile';
        user.command = '/file';
      }
      user.filename = parsedMessage.file;
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, msg);
      return logger.debug(sMessage);
    }
    //what if input is not yes, no, y, or n??
    if (user.confirm === 'sendFile'){
      var reply = "";
      if (affirmativeReply(fullMessage)) {
        user.confirm = 'askForAck';
        fileFlag = true;
        reply = "Would you like to ask the recipients for an acknowledgement?"
      } else if (negativeReply(fullMessage)) {
        user.confirm = "";
        fileFlag = false;
        reply = "File will not be sent as a broadcast message.";
      } else {
        user.confirm = 'sendFile';
        reply = "Invalid input, please reply with yes or no";
      } 
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'sendVoiceMemo') {
      var reply = "";
      if (affirmativeReply(fullMessage)) {
        user.confirm = 'askForAck';
        voiceMemoFlag = true;
        logger.debug("voiceMEmoFlag: " + voiceMemoFlag);
        reply = "Would you like to ask the recipients for an acknowledgement?"
      } else if (negativeReply(fullMessage)) {
        user.confirm = "";
        voiceMemoFlag = false;
        reply = "Voice Memo will not be sent as a broadcast message.";
      } else {
        user.confirm = 'sendVoiceMemo';
        reply = "Invalid input, please reply with yes or no";
      }
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'askForAck' && !fullMessage.startsWith("/broadcast")) {
      if (affirmativeReply(fullMessage)) {
        askForAckFlag = true;  
      } else if (negativeReply(fullMessage)) {
        askForAckFlag = false;
      } else {
        user.confirm === 'askForAck';
        var reply = 'Input not recognized please reply with yes or no.'
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      user.confirm = 'whichGroup';
      var reply = "Who would you like to receive this message?\n\n"; 
      var getGroups = WickrIOAPI.cmdGetSecurityGroups();
      securityGroups = JSON.parse(getGroups);
      var groupList = "Here is a list of the security groups:\n";
      for(var i = 0; i < securityGroups.length; i++){
        logger.debug(securityGroups[i].name);
        if (securityGroups[i].size === undefined)
            groupList = groupList + "(" + i + ") " +  securityGroups[i].name + "\n";
        else
            groupList = groupList + "(" + i + ") " +  securityGroups[i].name + " (users: " + securityGroups[i].size + ")\n";
      }
      reply = reply + groupList + "Please enter the number(s) of the security group(s) you would like to send your message to.\n\nOr reply *all* to send the message to everyone in the network";
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'whichGroup') {
      var reply;
      if (fullMessage.toLowerCase() === 'all') {
        securityGroupFlag = false;
        if (voiceMemoFlag || fileFlag){
          sendMessage(user, vGroupID, userEmail);
          return;
        } else {
          //TODO Should we confirm sending even if to the whole network??
          user.confirm = "askRepeat";
          //var userNumber = 666;
          //reply = "Message will be sent to network of " + userNumber + "\nWould you like to repeat this broadcast message?";
          reply = "Would you like to repeat this broadcast message?";
        }
      } else {
        user.confirm = "confirmSecurityGroups";
        var groups = fullMessage.split(/[^0-9]/);
        var groupsString = "";
        var reply;
        for (let group of groups){
          var index = parseInt(group);
          if (index >= 0 && index < securityGroups.length){
            securityGroupsToSend.push(securityGroups[index].id);
            logger.debug("Group added: " + securityGroups[index].name + " at " + securityGroups[index].id);
            groupsString = groupsString + securityGroups[index].name + "\n";
            securityGroupFlag = true;
            //add number of users to this string
            reply = "Your message will send to the following security group(s):\n" + groupsString + "Continue?"; 
            //TODO what if some indexes are good and others are not??
          } else {
            user.confirm = 'whichGroup';
            reply = "Invalid input: " + index + " please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.";
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            logger.error("index not in bounds" + index);
            return;
          }
        }
      }
      logger.debug("Groups to send!: " + securityGroupsToSend);
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'confirmSecurityGroups') {
      var reply;
      if (affirmativeReply(fullMessage)) {
        if (voiceMemoFlag || fileFlag){
          sendMessage(user, vGroupID, userEmail);
          return;
        } else {
            user.confirm = "askRepeat";
            reply = "Would you like to repeat this broadcast message?";
        }
      } else if (negativeReply(fullMessage)){
        user.confirm = 'whichGroup';
        reply = "Please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.";
      } else {
        user.confirm = 'whichGroup';
        reply = 'Input not recognized please reply with yes or no.';
      }
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      //TODO handle this better
    } else if (user.confirm === 'askRepeat') {
      var reply;
      if (negativeReply(fullMessage)) {
        user.confirm = "noRepeat";
        repeatFlag = false;
        sendMessage(user, vGroupID, userEmail);
        return;
      } else if (affirmativeReply(fullMessage)) {
        if (user.cronJobActive) {
          user.confirm = "activeRepeat";
          reply = "You already have a repeating broadcast message active, do you want to cancel it?";
        } else {
          user.confirm = "timesRepeat";
          reply = "How many times would you like to repeat this message?";
        }
      } else {
        user.confirm = "askRepeat";
        reply = 'Input not recognized please reply with yes or no.';
      }
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'activeRepeat' && affirmativeReply(fullMessage)) {
      user.cronJobActive = false;
      if(job) {
        job.stop();
      }
      user.confirm = "askRepeat";
      listen(message);
    } else if (user.confirm === 'timesRepeat') {
      user.confirm = "yesRepeat";
      if(!isInt(fullMessage) || parseInt(fullMessage) === 0){
        user.confirm = "timesRepeat";
        var reply = "Wrong Input, please send a number value.\nHow many times do you want to repeat this message?";
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      user.repeat = parseInt(fullMessage);
      user.count = 0;
      var reply = "How often do you want to repeat this message(choose every 5, 10 or 15 minutes)?";
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'yesRepeat') {
      //var broadcast = user.broadcast + "\n\nBroadcast message sent by: " + userEmail;
      var now = new Date();
      var minutes = now.getMinutes();
      minutes = minutes.toString();
      if (minutes.length === 2)
        minutes = minutes.charAt(1);

      //Setting a cron time interval based on current time
      if (minutes === '0') {
        minutes = '*'
      } else {
        minutes = minutes + '-59';
      }
      fullMessage = fullMessage.split(' ');
      logger.debug(fullMessage)
      if (fullMessage.includes("5")) {
        user.confirm = "confirmed";
        cronInterval = minutes + '/5 * * * *';
      } else if (fullMessage.includes("10")) {
        user.confirm = "confirmed";
        cronInterval = minutes + '/10 * * * *';
      } else if (fullMessage.includes("15")) {
        //TODO why is this not also confirmed?
        user.confirm = "";
        cronInterval = minutes + '/15 * * * *';
      }else {
        logger.debug('ELSE')
        user.confirm = "yesRepeat";
        var reply = "Wrong Input, please send a number value.\nHow often do you want to repeat this message(choose every 5, 10 or 15 minutes)?";
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      repeatFlag = true;
      sendMessage(user, vGroupID, userEmail);
      //TODO IMPORTANT Fix this! 
    } else if (user.confirm === 'askMessageId' && fullMessage != "/status") {
      var groups = fullMessage.split(/[^0-9]/);
      //TODO turn array into a single variable
      var messageIdEntriesToSend = []
      for(let group of groups){
        var index = parseInt(group);
        //TODO fix this for now keep so user doesn't see 0 based!
        //TODO fix this because we don't necessarily need an array!
        index = index - 1;
        if(index >= 0 && index < messageIdEntries.length){
          messageIdEntriesToSend.push(messageIdEntries[index]);
          logger.debug("Message Added: " + messageIdEntries[index].message_id + " at " + index);
          user.confirm = '';
        } else {
          user.confirm = 'askMessageId';
          var reply = "Invalid input: " + (index + 1) + " please enter a number between 1 and " + messageIdEntries.length;
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          logger.error("index not in bounds" + index);
          return;
        }
      }
      var reply = "";
      for (let entry of messageIdEntriesToSend){
        var replyObj = getStatus(entry.message_id, "summary", false);
        logger.debug("replyOBJ ois " + replyObj);
        //logger.debug("replyOBJ.status string is " + replyObj.statusString);
        reply += replyObj;//.statusString;
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      }
    } else if (user.confirm === 'idForReport' && fullMessage != "/report") {
      var groups = fullMessage.split(/[^0-9]/);
      //TODO turn array into a single variable
      var messageIdEntriesToSend = []
      for(let group of groups){
        var index = parseInt(group);
        index = index - 1;
        if(index >= 0 && index < messageIdEntries.length){
          messageIdEntriesToSend.push(messageIdEntries[index]);
          logger.debug("Message Added: " + messageIdEntries[index].message_id + " at " + index);
          user.confirm = '';
        } else {
          user.confirm = 'idForReport';
          //fix 1 to five for if there are fewer entries!!
          var reply = "Invalid input: " + (index + 1) + "  please enter a number between 1 and " + messageIdEntries.length;
          var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
          logger.error("index not in bounds" + (index + 1));
          return;
        }
      }
      //TODO check results of this
      var path = getCSVReport(messageIdEntries[index].message_id);
      var uMessage = WickrIOAPI.cmdSendRoomAttachment(vGroupID, path, path);
      logger.debug(uMessage);
    }
  } catch (err) {
    console.log(err);
  }
}

function readFileInput() {
  try {
    var rfs = fs.readFileSync('./processes.json', 'utf-8');
    if (!rfs) {
      console.log("Error reading processes.json!")
      return rfs;
    } else
      return rfs.trim().split('\n');
    }
  catch (err) {
    console.log(err);
    process.exit();
  }
}

function updateWhiteList()
{
    var processes;
    try {
        processes = fs.readFileSync('./processes.json', 'utf-8');
        if (!processes) {
          console.log("Error reading processes.json!")
          return;
        }
    }
    catch (err) {
        console.log(err);
        return;
    }

    var pjson = JSON.parse(processes);
    console.log(pjson);

    var wlUsers = whitelisted_users.join(',');
    if (pjson.apps[0].env.tokens.WHITELISTED_USERS.encrypted) {
        var wlUsersEncrypted = WickrIOAPI.cmdEncryptString(wlUsers);
        pjson.apps[0].env.tokens.WHITELISTED_USERS.value = wlUsersEncrypted;
    } else {
        pjson.apps[0].env.tokens.WHITELISTED_USERS.value = wlUsers;
    }

    console.log(pjson);

    try {
        var cp = execSync('cp processes.json processes_backup.json');
        var ps = fs.writeFileSync('./processes.json', JSON.stringify(pjson, null, 2));
    } catch (err) {
        console.log(err);
    }
}

function cronJob(job, cronInterval, user, broadcast, sgFlag, userEmail, target){
job = new CronJob(cronInterval, function() {
  var currentDate = new Date();
  var jsonDateTime = currentDate.toJSON();
  var bMessage;
  var messageId = updateLastID();
  logger.debug("CronJob");
  //Repeated messages should get new Message IDs
  var broadcastMsgToSend = broadcast + "\n\nBroadcast message sent by: " + userEmail;
  if(sgFlag) {
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
  var reply = "Broadcast message # " + (
  user.count + 1) + " in process of being sent";
  var uMessage = WickrIOAPI.cmdSendRoomMessage(user.vGroupID, reply);
  //Will this stay the same or could user be reset?? I believe only can send one repeat message
  user.count += 1;
  if (user.count > user.repeat) {
    user.cronJobActive = false;
    return job.stop();
  }
});
job.start();
user.cronJobActive = true;
}

//Sends every 30 seconds
//TODO add a counter here?
function asyncStatus(messageId, groupId){
logger.debug("asyncStatus we are in");
var asyncJob = new CronJob("*/30 * * * * *", function() {
  logger.debug("inside the job function now");
  var statusObj = getStatus(messageId, "summary", true);
  logger.debug("Status obj string is " + statusObj.statusString);
  var uMessage = WickrIOAPI.cmdSendRoomMessage(groupId, statusObj.statusString);
  logger.debug("Umessage inside asyncstatus" + uMessage);
  if (statusObj.complete) {
    logger.debug("ending job for complete string");
    return asyncJob.stop();
  }
});
asyncJob.start();
}

function affirmativeReply(message){
  return message.toLowerCase() === 'yes' || message.toLowerCase() === 'y';
}

function negativeReply(message){
  return message.toLowerCase() === 'no' || message.toLowerCase() === 'n';
}

function verifyUser(user) {
  var found = whitelisted_users.indexOf(user);
  if (found === -1) {
    return false;
  } else {
    return true;
  }
}

function isInt(value) {
  return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value))
}

function sendMessage(user, vGroupID, userEmail){
  var reply = "Broadcast message in process of being sent";
  var broadcast = user.broadcast;
  var broadcastMsgToSend = user.broadcast + "\n\nBroadcast message sent by: " + userEmail;
  var sentby = "Broadcast message sent by: " + userEmail;
  var askForAckString = "";
  if (askForAckFlag) {
    broadcastMsgToSend = broadcastMsgToSend + "\nPlease acknowledge this message by replying with /ack";
    sentby = sentby + "\nPlease acknowledge this message by replying with /ack";
  }
  var messageID = updateLastID();
  var target;
  //TODO the nice ternary operator maybe??
  if (securityGroupsToSend.length < 1 || securityGroupsToSend == undefined){
    target = "NETWORK";
  } else {
    target = securityGroupsToSend.join();
  }
  logger.debug("this is the messageID in the sMessage func" + messageID);
  if(securityGroupFlag){
    if(voiceMemoFlag){
      var duration = "" + user.voiceMemoDuration;
      var sendVoiceMemo = WickrIOAPI.cmdSendSecurityGroupVoiceMemo(securityGroupsToSend, user.voiceMemoLocation, "VoiceMemo", duration, "", "",  messageID, sentby);
      logger.debug(sendVoiceMemo);
      //optionally add to which groups?
      reply = "Broadcast voice memo message in process of being sent to security group";
    } else if (fileFlag){
      logger.debug("Here is the filename:" + user.filename);
      var send = WickrIOAPI.cmdSendSecurityGroupAttachment(securityGroupsToSend, user.filename, displayName, "", "", messageID, sentby);
      logger.debug(send)
      reply = "Broadcast file message in process of being sent to security group";
    } else {
      if(repeatFlag){
        repeatMessage(broadcast, user, vGroupID, messageID, userEmail, target);
      } else {
        logger.debug("This is messageID:" + messageID +":");
        logger.debug("this is the securityGroupsToSend" + securityGroupsToSend);
        logger.debug("this is the broadcastMsgToSend" + broadcastMsgToSend);
        var send = WickrIOAPI.cmdSendSecurityGroupMessage(broadcastMsgToSend, securityGroupsToSend, "", "", messageID);
        logger.debug("this is send:" + send)
        reply = "Broadcast message in process of being sent to security group";
      }
    }
  } else {
    if(voiceMemoFlag){
      var duration = "" + user.voiceMemoDuration;
      var sendVoiceMemo = WickrIOAPI.cmdSendNetworkVoiceMemo(user.voiceMemoLocation, "VoiceMemo", duration, "", "", messageID, sentby);
      logger.debug(sendVoiceMemo);
      reply = "Broadcast voice memo message in process of being sent";
    } else if(fileFlag){
      logger.debug("This is the sentby" + sentby);
      var send = WickrIOAPI.cmdSendNetworkAttachment(user.filename, displayName, "", "", messageID, sentby);
      logger.debug("this is send" + send)
      reply = "Broadcast file message in process of being sent";
    } else {
      if(repeatFlag){
        repeatMessage(broadcast, user, vGroupID, messageID, userEmail, target);
      } else {
        logger.debug("This is messageID:" + messageID +":");
        var bMessage = WickrIOAPI.cmdSendNetworkMessage(broadcastMsgToSend, "", "", messageID);
        logger.debug("This is bMessage: " + bMessage)
        reply = "Broadcast message in process of being sent";
      }
    }
  }
  //what if message fails?
  if(!repeatFlag) {
    var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    logger.debug(uMessage);
    //securityGroupsToSend = [];
    //voiceMemoFlag = false;
    //fileFlag = false;
    //repeatFlag = false;
    //user.broadcast = "";
    //displayName = "";
  }

  var currentDate = new Date();
  //"YYYY-MM-DDTHH:MM:SS.sssZ"
  var jsonDateTime = currentDate.toJSON();
  if (fileFlag) {
    messageID = "" + messageID;
    writeToMessageIdDB(messageID, userEmail, target, jsonDateTime, displayName);
  } else if (voiceMemoFlag){
    messageID = "" + messageID;
    writeToMessageIdDB(messageID, userEmail, target, jsonDateTime, ("VoiceMemo-" + jsonDateTime));
  } else if (!fileFlag && !voiceMemoFlag) {
    logger.debug("write to messageIdDB");
    messageID = "" + messageID;
    writeToMessageIdDB(messageID, userEmail, target, jsonDateTime, user.broadcast);
  }
  asyncStatus(messageID, vGroupID);
  securityGroupsToSend = [];
  voiceMemoFlag = false;
  fileFlag = false;
  repeatFlag = false;
  user.broadcast = "";
  displayName = "";
}

//TODO get target inside function
function repeatMessage(broadcast, user, vGroupID, messageID, userEmail, target) {
  //Send first repeated message before starting the cronJob
  logger.debug('cronInterval:', cronInterval)
  var bMessage;
  var currentDate = new Date();
  var jsonDateTime = currentDate.toJSON();
  var broadcastMsgToSend = broadcast + "\n\nBroadcast message sent by: " + userEmail;
  logger.debug("Security group flag is: " + securityGroupFlag);
  if(securityGroupFlag){
    messageID = "" + messageID;
    bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(broadcastMsgToSend, securityGroupsToSend, "", "", messageID);
  } else {
    messageID = "" + messageID;
    bMessage = WickrIOAPI.cmdSendNetworkMessage(broadcastMsgToSend, "", "", messageID);
  }
  logger.debug(bMessage)
  var reply = "Broadcast message # " + (user.count + 1) + " in process of being sent";
  var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
  user.count += 1;
  cronJob(job, cronInterval, user, broadcast, securityGroupFlag, userEmail, target);
}

function getMessageEntries(userEmail){
  var messageIdEntries = []
  var tableDataRaw = WickrIOAPI.cmdGetMessageIDTable("0","1000");
  var tableData = JSON.parse(tableDataRaw);
  for(var i = tableData.length - 1; i > 0; i--) {
    var entry = tableData[i];
    logger.debug("entry: " + entry);
    //logger.debug("entry keys: " + Object.keys(entry));
    if (entry.sender === userEmail) {
      messageIdEntries.push(entry);
    }
    if (messageIdEntries.length > 4) {
      break;
    }
  }
  for (let entry of messageIdEntries) {
  //  var status = getStatus(entry.id, "summary");
    logger.debug(entry.message_id);
    //logger.debug(entry.message);
  }
  return messageIdEntries;
  //var statusData = WickrIOAPI.cmdGetMessageStatus(messageID, type, "0", "1000");
}

function getStatus(messageID, type, async){
  //Here we need which Message??
  messageID = "" + messageID;
  var statusData;
  try{
    statusData = WickrIOAPI.cmdGetMessageStatus(messageID, type, "0", "1000");
  } catch(err) {
    if(async) {
      var returnObj = {
        statusString:  "No data found for that message",
        complete: true
      };
      return returnObj;
    } else {
      return "No data found for that message";
    }
  }
  var messageStatus = JSON.parse(statusData);
  var output = [];
  var totalUsers = "Total Users: " + messageStatus.num2send + '\n';
  var sentUsers = "Messages Sent: " + messageStatus.sent + '\n';
  var ackedUsers = "Users Acknowledged: " + messageStatus.acked + '\n';
  var pendingUsers = "Message pending to Users: "  + messageStatus.pending + '\n';
  var failedUsers = "Message failed to send: " + messageStatus.failed;
  output.push("*Message Status:*\n", totalUsers, sentUsers, ackedUsers, pendingUsers, failedUsers);
  var statusString = output.join("");
  logger.debug("here is the message status" + statusString);
  if(async) {
    var complete = messageStatus.pending === 0;
    var returnObj = {
      statusString:  statusString,
      complete: complete
    };
    return returnObj;
  } else {
    return statusString;
  }
}

function updateLastID(){
  try{
    var id;
    if(fs.existsSync('last_id.json')){
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
  } catch(err) {
    logger.error(err);
  }
}

function writeToMessageIdDB(messageId, sender, target, dateSent, messageContent){
  logger.debug("inside~writeToMessageIdDB");
  WickrIOAPI.cmdAddMessageID(messageId, sender, target, dateSent, messageContent);
}

function setMessageStatus(messageId, userId, messageStatus){
  var reply = WickrIOAPI.cmdSetMessageStatus(messageId, userId, messageStatus);
  var userArray = [ userId ];
  var uMessage = WickrIOAPI.cmdSend1to1Message(userArray, reply);
}

function get_LastID(){
  var data = fs.readFileSync('last_id.json');
  return JSON.parse(data);
}

function getCSVReport(messageId) {
  var inc = 0;
  var csvArray = [];
  while(true) {
    var statusData = WickrIOAPI.cmdGetMessageStatus(messageId, "full", "" + inc, "1000");
    var messageStatus = JSON.parse(statusData);
    logger.debug("This is messageStatus" + messageStatus);
    for (let entry of messageStatus) {
      var failureString = "";
      var statusString = "";
      switch(entry.status) {
        case 0:
          statusString = "pending";
          break;
        case 1:
          statusString = "sent";
          break;
        case 2:
          statusString = "failed";
          failureString = entry.status_message;
          break;
        case 3:
          statusString = "acked";
          break;
      }
      csvArray.push({user: entry.user, status: statusString, failureMessage: failureString});
    } 
    if (messageStatus.length < 1000) {
      break;
    }
    inc++;
  }
  var now  = new Date();
  var dateString = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear() + "_" + now.getHours() + "_" + now.getMinutes() + "_" + now.getSeconds();
  
  var path = process.cwd() + "/attachments/report-" + dateString + ".csv" ;
  writeCSVReport(path, csvArray);
  return path;
}

function writeCSVReport(path, csvArray) {
  var csvWriter = createCsvWriter({
    path: path,
    header: [
      {id: 'user', title: 'USER'},
      {id: 'status', title: 'STATUS'},
      {id: 'failureMessage', title: 'FAILURE MESSAGE'}
    ]
  });
  csvWriter.writeRecords(csvArray)
    .then(() => {
      logger.debug('...Done');
    });
}

main();
