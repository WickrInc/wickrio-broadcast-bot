const fs = require('fs');
// const {exec, execSync, execFileSync} = require('child_process');
const WickrIOAPI = require('wickrio_addon');
const WickrIOBotAPI = require('wickrio-bot-api');

const { WickrUser } = WickrIOBotAPI;
const bot = new WickrIOBotAPI.WickrIOBot();
// const pkgjson = require('./package.json');
const writer = require('./src/helpers/message-writer.js');
const logger = require('./src/logger');
// const WhitelistRepository = require('./src/helpers/whitelist');
const Version = require('./src/commands/version');

const FileHandler = require('./src/helpers/file-handler');
const Factory = require('./src/factory');
const State = require('./src/state');

const APIService = require('./src/services/api-service');
const BroadcastService = require('./src/services/broadcast-service');
const MessageService = require('./src/services/message-service');
const SendService = require('./src/services/send-service');
const StatusService = require('./src/services/status-service');
const RepeatService = require('./src/services/repeat-service');
const ReportService = require('./src/services/report-service');
const GenericService = require('./src/services/generic-service');

let currentState;

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

// catches ctrl+c and stop.sh events
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }));
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }));

// catches uncaught exceptions
// TODO make this more robust of a catch
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

async function main() {
  console.log('Entering main!');
  try {
    const tokens = JSON.parse(process.env.tokens);
    const status = await bot.start(tokens.WICKRIO_BOT_NAME.value);
    if (!status) {
      exitHandler(null, {
        exit: true,
        reason: 'Client not able to start',
      });
    }

    // TODO set to true and send from a non admin and see what happens
    bot.setAdminOnly(false);

    WickrIOAPI.cmdSetControl('cleardb', 'true');
    WickrIOAPI.cmdSetControl('contactbackup', 'false');
    WickrIOAPI.cmdSetControl('convobackup', 'false');
    // Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen);
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


main();
