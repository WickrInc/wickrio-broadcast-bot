import fs from 'fs';
import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import multer from 'multer'
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer';
import { CronJob } from 'cron';
import { getLogger } from 'log4js';
import * as WickrIOBotAPI from 'wickrio-bot-api'
import strings from './strings';

const WickrUser = WickrIOBotAPI.WickrUser;
const bot = new WickrIOBotAPI.WickrIOBot();
const WickrIOAPI = bot.getWickrIOAddon();

const app = express();
app.use(helmet()); //security http headers

var logger = getLogger();
logger.level = 'debug';

var job;
var verifyUsersMode;

// need to be able to debug and lint for syntax errors


// set upload destination for attachments sent to broadcast with multer 
var upload = multer({ dest: 'uploads/' })

//
// Web interface definitions
// 
var bot_port, bot_api_key, bot_api_auth_token;
var client_auth_codes = {};

process.stdin.resume(); //so the program will not close instantly
if (!fs.existsSync(process.cwd() + "/uploads")) {
  mkdirSync(process.cwd() + "/attachments");
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
process.on('SIGINT', exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { pid: true }));
process.on('SIGUSR2', exitHandler.bind(null, { pid: true }));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

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
var messagesForReport = [];

// using cronjobs to handle repeats
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

    bot.setAdminOnly(false);

    // set the verification mode to true
    if (tokens.VERIFY_USERS.encrypted) {
      verifyUsersMode = WickrIOAPI.cmdDecryptString(tokens.VERIFY_USERS.value);
    } else {
      verifyUsersMode = tokens.VERIFY_USERS.value;
    }

    bot.setVerificationMode(verifyUsersMode);

    //Passes a callback function that will receive incoming messages into the bot client
    bot.startListening(listen);

    var { BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT } = tokens

    if (BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT) {
      bot_port = tokens.BOT_PORT.value;
      bot_api_key = tokens.BOT_KEY.value;
      bot_api_auth_token = tokens.BOT_AUTH_TOKEN.value;

      app.listen(bot_port, () => {
        console.log('We are live on ' + bot_port);
      });

      // parse application/x-www-form-urlencoded
      app.use(bodyParser.urlencoded({ extended: false }));
      // parse application/json
      app.use(bodyParser.json());
      app.use(express.static('wickrio-bot-web/public'))


      app.use(function (error, req, res, next) {

        if (error instanceof SyntaxError) {
          console.log('bodyParser:', error);
          res.statusCode = 400;
          res.type('txt').send(error.toString());
        } else {
          next();
        }
      });

      // add cors for development
      // TODO: set conditional for NODE_ENV to match and set the right origin host header - 8000 for dev, 4545 for prod
      app.options("/*", function (req, res, next) {
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Origin', 'http://localhost:8000');

        res.sendStatus(200)
      });

      app.all("/*", function (req, res, next) {
        res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
        next()
      });

      var endpoint = "/WickrIO/V1/Apps/" + bot_api_key;

      app.post(endpoint + "/Authenticate/:wickrUser", function (req, res) {
        res.set('Content-Type', 'text/plain');
        res.set('Authorization', 'Basic base64_auth_token');

        var authHeader = req.get('Authorization');
        var authToken;
        if (authHeader) {
          if (authHeader.indexOf(' ') == -1) {
            authToken = authHeader;
          } else {
            authHeader = authHeader.split(' ');
            authToken = authHeader[1];
          }
        } else {
          return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"');
        }
        if (!checkCreds(authToken)) {
          return res.status(401).send('Access denied: invalid basic-auth token.');
        } else {
          var wickrUser = req.params.wickrUser;
          if (typeof wickrUser !== 'string')
            return res.status(400).send('Bad request: WickrUser must be a string.');

          // Check if this user is an administrator
          var adminUser = bot.myAdmins.getAdmin(wickrUser);
          if (adminUser === undefined) {
            return res.status(401).send('Access denied: ' + wickrUser + ' is not authorized to broadcast!');
          }

          var ttl = "", bor = "";
          var users = [];
          users.push(wickrUser);

          var random = generateRandomString(24);
          var message = "Authentication code: " + random;

          // Save the auth key for the wickrUser
          client_auth_codes[wickrUser] = random;

          try {
            var csm = WickrIOAPI.cmdSend1to1Message(users, message, ttl, bor);
            console.log(csm);
            res.send(csm);
          } catch (err) {
            console.log(err);
            res.statusCode = 400;
            res.send(err.toString());
          }
        }
      });

      function checkAuth(req, res) {
        var authHeader = req.get('Authorization');

        res.set('Content-Type', 'text/plain');
        res.set('Authorization', 'Basic base64_auth_token');

        console.log('hit broadcast')

        var authToken;
        if (authHeader) {
          if (authHeader.indexOf(' ') == -1) {
            authToken = authHeader;
          } else {
            authHeader = authHeader.split(' ');
            authToken = authHeader[1];
          }
        } else {
          return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"');
        }

        // check credentials, decode base 64 token, and checks it against bot api token from setup
        if (!checkCreds(authToken)) {
          return res.status(401).send('Access denied: invalid basic-auth token.');
        }

        // typecheck and validate parameters
        var wickrUser = req.params.wickrUser;
        if (typeof wickrUser !== 'string')
          return res.status(401).send("WickrUser must be a string.");
        var authCode = req.params.authCode;
        if (typeof authCode !== 'string')
          return res.status(401).send("Authentication Code must be a string.");

        // Check if the authCode is valid for the input user
        var dictAuthCode = client_auth_codes[wickrUser];
        if (dictAuthCode === undefined || authCode != dictAuthCode) {
          return res.status(401).send('Access denied: invalid user authentication code.');
        }

      }

      function sendBroadcast(broadcast, wickrUser, res) {
        try {
          // send broadcast
          var currentDate = new Date();
          var jsonDateTime = currentDate.toJSON();
          var messageID = updateLastID();
          let { acknowledge, file, repeat, message, security_group } = broadcast

          // need to return error, and have route try, catch this function
          if (!message) return res.send("need a 'message' in the form")

          if (acknowledge === true) message = message + "\nPlease acknowledge this message by replying with /ack"

          message = message + "\n\nBroadcast message sent by: " + wickrUser;

          var bMessage;
          if (security_group != false) {

            // make sure users are registered in group
            if (security_group.length === 0) return res.send("Security Group length invalid.");

            // store security groups from request body
            // use this to cache security groups and avoid a call?
            var securityGroups = [];
            securityGroups.push(security_group);

            if (file) {
              // send message with or without a repeat
              if (repeat) {
                broadcast.count = 0
                console.log(repeat)
                // validate cronjob interval
                job = new CronJob(repeat, function () {
                  var jsonDateTime = new Date().toJSON();
                  var bMessage;
                  var messageId = updateLastID();
                  logger.debug("CronJob", repeat);


                  messageId = "" + messageId;
                  // bMessage = WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageId);
                  console.log({ vGroupID })
                  // this sends attachment to whole network, need a group attachment function
                  console.log("this send attachment to whole network, need a group attachment function")

                  // var bMessage = WickrIOAPI.cmdSendNetworkAttachment(`../integration/wickrio-broadcast-bot/${file.path}`, file.originalname, "", "", messageID, message);
                  // logger.debug(bMessage);
                  bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(message, security_group, "", "", messageId);
                  logger.debug(bMessage);

                  writeToMessageIdDB(messageID, wickrUser, security_group, jsonDateTime, message);
                  //     asyncStatus(messageId, user.vGroupID);

                  var reply = strings["repeatMessageSent"].replace("%{count}", (broadcast.count + 1));
                  // what does use send room message doo
                  var uMessage = WickrIOAPI.cmdSendRoomMessage(broadcast.vGroupID, reply);
                  //Will this stay the same or could user be reset?? I believe only can send one repeat message
                  broadcast.count += 1;
                  if (broadcast.count > repeat) {
                    broadcast.cronJobActive = false;
                    return job.stop();
                  }
                });
                job.start();
              } else {
                console.log(vGroupID)
                logger.debug("This is sentby" + wickrUser);
                // this sends attachment to whole network, need a group attachment function
                console.log("this send attachment to whole network, need a group attachment function")

                // var bMessage = WickrIOAPI.cmdSendNetworkAttachment(`../integration/wickrio-broadcast-bot/${broadcast.file.path}`, broadcast.file.originalname, "", "", messageID, broadcastMsgToSend);
                logger.debug("this is sent" + bMessage)
                bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(message, security_group, "", "", messageId);
                reply = strings["fileSent"];
              }
            } else {
              // send message to group with or without a repeat
              if (repeat) {
                job = new CronJob(repeat, function () {
                  var currentDate = new Date();
                  var jsonDateTime = currentDate.toJSON();
                  var messageId = updateLastID();
                  logger.debug("CronJob", repeat);

                  bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(message, security_group, "", "", messageId);
                  messageId = "" + messageId;
                  writeToMessageIdDB(messageId, wickrUser, security_group, jsonDateTime, message);
                  asyncStatus(messageId, user.vGroupID);

                  logger.debug(bMessage);
                  var reply = strings["repeatMessageSent"].replace("%{count}", (user.count + 1));
                  var uMessage = WickrIOAPI.cmdSendRoomMessage(user.vGroupID, reply);
                  //Will this stay the same or could user be reset?? I believe only can send one repeat message
                  user.count += 1;
                  if (user.count > repeat) {
                    user.cronJobActive = false;
                    return job.stop();
                  }
                });
                job.start();
              } else {

                writeToMessageIdDB(messageID, wickrUser, broadcast.security_group, jsonDateTime, broadcast.message);
                bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(broadcastMsgToSend, securityGroups, "", "", messageID);
                var uMessage = WickrIOAPI.cmdSendRoomMessage(user.vGroupID, reply);

              }
              console.log('sending to security group ' + broadcast.security_group);

            }
            // else if no security groups
            // broadcast to whole network
          } else if (securityGroup === false) {
            if (file) {
              // send file with or without a repeat
              if (repeat) {
                job = new CronJob(repeat, function () {
                  var currentDate = new Date();
                  var jsonDateTime = currentDate.toJSON();
                  var bMessage;
                  var messageId = updateLastID();
                  console.log({ broadcast, vGroupID })
                  logger.debug("CronJob", sgFlag);

                  messageId = "" + messageId;
                  bMessage = WickrIOAPI.cmdSendNetworkAttachment(`../integration/wickrio-broadcast-bot/${file.path}`, file.originalname, "", "", messageID, broadcastMsgToSend);
                  logger.debug(bMessage)

                  logger.debug("messageId: " + messageId + "userEmail" + wickrUser + "target" + security_group + "dt" + jsonDateTime + "bcast" + message);
                  writeToMessageIdDB(messageId, wickrUser, target, jsonDateTime, message);
                  asyncStatus(messageId, broadcast.vGroupID);

                  logger.debug(bMessage);
                  var reply = strings["repeatMessageSent"].replace("%{count}", (broadcast.count + 1));
                  var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
                  //Will this stay the same or could user be reset?? I believe only can send one repeat message
                  broadcast.count += 1;
                  if (broadcast.count > repeat) {
                    broadcast.cronJobActive = false;
                    return job.stop();
                  }
                });
                job.start();
              } else {
                logger.debug("This is sentby" + wickrUser);
                var bMessage = WickrIOAPI.cmdSendNetworkAttachment(`../integration/wickrio-broadcast-bot/${file.path}`, file.originalname, "", "", messageID, broadcastMsgToSend);
                logger.debug("this is sent" + bMessage)
                reply = strings["fileSent"];
              }
            } else {
              if (repeat) {
                // send message with or without a repeat
                job = new CronJob(repeat, function () {
                  var currentDate = new Date();
                  var jsonDateTime = currentDate.toJSON();
                  var bMessage;
                  var messageId = updateLastID();
                  logger.debug("CronJob", repeat);

                  messageId = "" + messageId;
                  bMessage = WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageId);
                  logger.debug("messageId: " + messageId + "userEmail" + wickrUser + "target" + target + "dt" + jsonDateTime + "bcast" + message);
                  writeToMessageIdDB(messageId, wickrUser, target, jsonDateTime, message);
                  asyncStatus(messageId, user.vGroupID);

                  logger.debug(bMessage);
                  var reply = strings["repeatMessageSent"].replace("%{count}", (user.count + 1));
                  var uMessage = WickrIOAPI.cmdSendRoomMessage(user.vGroupID, reply);
                  //Will this stay the same or could user be reset?? I believe only can send one repeat message
                  user.count += 1;
                  if (user.count > user.repeat) {
                    user.cronJobActive = false;
                    return job.stop();
                  }
                });
                job.start();
              } else {
                writeToMessageIdDB(messageID, wickrUser, "network", jsonDateTime, message);
                bMessage = WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageID);

                console.log('sending to entire network!');
                console.log({ bMessage });
              }
            }
          }

          console.log(bMessage);
          res.send(bMessage);
        } catch (err) {
          console.log(err);
          res.statusCode = 400;
          res.send(err.toString());
        }
      }

      // broadcast endpoint needs to accept and send files
      app.post(endpoint + "/Broadcast/:wickrUser/:authCode", upload.single('attachment'), function (req, res) {
        const wickrUser = req.params.wickrUser;
        // check auth
        checkAuth(req, res)
        let { message, acknowledge, security_group, repeat_num, freq_num } = req.body

        if (!message) return res.send("Broadcast message missing from request.");
        console.log(req.body)

        let broadcast = {}
        broadcast.security_group = security_group || false
        broadcast.file = req.file || false
        broadcast.repeat_num = repeat_num || false
        broadcast.acknowledge = acknowledge || false
        broadcast.freq_num = freq_num || false
        broadcast.message = message

        // console.log({ broadcast })
        // validate a message was sent in the request body
        sendBroadcast(broadcast, wickrUser, res)
      });

      app.get(endpoint + "/SecGroups/:wickrUser/:authCode", function (req, res) {
        res.set('Content-Type', 'text/plain');
        res.set('Authorization', 'Basic base64_auth_token');
        var authHeader = req.get('Authorization');
        console.log('hit secgroups')
        var authToken;
        if (authHeader) {
          if (authHeader.indexOf(' ') == -1) {
            authToken = authHeader;
          } else {
            authHeader = authHeader.split(' ');
            authToken = authHeader[1];
          }
        } else {
          console.log('access denied, need auth')
          return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"');
        }

        if (!checkCreds(authToken)) {
          return res.status(401).send('Access denied: invalid basic-auth token.');
        }

        var wickrUser = req.params.wickrUser;
        if (typeof wickrUser !== 'string')
          return res.status(401).send("WickrUser must be a string.");
        var authCode = req.params.authCode;
        if (typeof authCode !== 'string')
          return res.status(401).send("Authentication Code must be a string.");

        // Check if the authCode is valid for the input user
        var dictAuthCode = client_auth_codes[wickrUser];

        if (dictAuthCode === undefined) {

          return res.status(401).send('Access denied: no user authentication code.');
        }
        if (authCode != dictAuthCode) {
          return res.status(401).send('Access denied: invalid user authentication code.');
        }

        try {
          var getGroups = WickrIOAPI.cmdGetSecurityGroups();
          var response = isJson(getGroups);
          if (response !== false) {
            getGroups = response;
          } else {
            getGroups = '{}';
          }
          res.set('Content-Type', 'application/json');
          res.send(getGroups);
        } catch (err) {
          console.log(err);
          res.statusCode = 400;
          res.type('txt').send(err.toString());
        }
      });

      app.get(endpoint + "/Status/:wickrUser/:authCode", function (req, res) {
        res.set('Content-Type', 'text/plain');
        res.set('Authorization', 'Basic base64_auth_token');
        var authHeader = req.get('Authorization');
        var authToken;
        if (authHeader) {
          if (authHeader.indexOf(' ') == -1) {
            authToken = authHeader;
          } else {
            authHeader = authHeader.split(' ');
            authToken = authHeader[1];
          }
        } else {
          return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"');
        }

        if (!checkCreds(authToken)) {
          return res.status(401).send('Access denied: invalid basic-auth token.');
        }

        var wickrUser = req.params.wickrUser;
        if (typeof wickrUser !== 'string')
          return res.status(401).send("WickrUser must be a string.");
        var authCode = req.params.authCode;
        if (typeof authCode !== 'string')
          return res.status(401).send("Authentication Code must be a string.");

        // Check if the authCode is valid for the input user
        var dictAuthCode = client_auth_codes[wickrUser];
        if (dictAuthCode === undefined || authCode != dictAuthCode) {
          return res.status(401).send('Access denied: invalid user authentication code.');
        }


        var messageIdEntries = getMessageEntries(wickrUser, 20);
        var reply = "";
        if (messageIdEntries.length < 1) {
          reply = strings["noPrevious"];
        } else {
          var length = Math.min(messageIdEntries.length, 5);
          var contentData;
          var index = 1;
          var messageList = [];
          var messageString = "";
          for (var i = 0; i < messageIdEntries.length; i++) {
            contentData = WickrIOAPI.cmdGetMessageIDEntry(messageIdEntries[i].message_id);
            var contentParsed = JSON.parse(contentData);
            messageIdEntries[i]['message'] = contentParsed.message;
            //                    messageList.push(contentParsed.message);
            //                    messageString += '(' + index++ + ') ' + contentParsed.message + "\n";
          }
          //                reply = strings["whichMessage"].replace("%{length}", length).replace("%{messageList}", messageString);
          reply = JSON.stringify(messageIdEntries);
        }
        res.set('Content-Type', 'application/json');
        return res.send(reply);
      });

      app.get(endpoint + "/Status/:wickrUser/:authCode/:messageID", function (req, res) {
        res.set('Content-Type', 'text/plain');
        res.set('Authorization', 'Basic base64_auth_token');
        var authHeader = req.get('Authorization');
        var authToken;
        if (authHeader) {
          if (authHeader.indexOf(' ') == -1) {
            authToken = authHeader;
          } else {
            authHeader = authHeader.split(' ');
            authToken = authHeader[1];
          }
        } else {
          return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"');
        }

        if (!checkCreds(authToken)) {
          return res.status(401).send('Access denied: invalid basic-auth token.');
        }

        var wickrUser = req.params.wickrUser;
        if (typeof wickrUser !== 'string')
          return res.status(401).send("WickrUser must be a string.");
        var authCode = req.params.authCode;
        if (typeof authCode !== 'string')
          return res.status(401).send("Authentication Code must be a string.");

        // Check if the authCode is valid for the input user
        var dictAuthCode = client_auth_codes[wickrUser];
        if (dictAuthCode === undefined || authCode != dictAuthCode) {
          return res.status(401).send('Access denied: invalid user authentication code.');
        }


        var statusData = WickrIOAPI.cmdGetMessageStatus(req.params.messageID, "summary", "0", "1000");
        var reply = statusData;
        res.set('Content-Type', 'application/json');
        return res.send(reply);
      });

      app.get(endpoint + "/Report/:wickrUser/:authCode/:messageID/:page/:size", function (req, res) {
        res.set('Content-Type', 'text/plain');
        res.set('Authorization', 'Basic base64_auth_token');
        var authHeader = req.get('Authorization');
        var authToken;
        if (authHeader) {
          if (authHeader.indexOf(' ') == -1) {
            authToken = authHeader;
          } else {
            authHeader = authHeader.split(' ');
            authToken = authHeader[1];
          }
        } else {
          return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"');
        }

        if (!checkCreds(authToken)) {
          return res.status(401).send('Access denied: invalid basic-auth token.');
        }

        var wickrUser = req.params.wickrUser;
        if (typeof wickrUser !== 'string')
          return res.status(401).send("WickrUser must be a string.");
        var authCode = req.params.authCode;
        if (typeof authCode !== 'string')
          return res.status(401).send("Authentication Code must be a string.");

        // Check if the authCode is valid for the input user
        var dictAuthCode = client_auth_codes[wickrUser];
        if (dictAuthCode === undefined || authCode != dictAuthCode) {
          return res.status(401).send('Access denied: invalid user authentication code.');
        }

        var reportEntries = [];

        var statusData = WickrIOAPI.cmdGetMessageStatus(req.params.messageID, "full", req.params.page, req.params.size);
        var messageStatus = JSON.parse(statusData);
        for (var entry of messageStatus) {
          var statusMessageString = "";
          var statusString = "";
          switch (entry.status) {
            case 0:
              statusString = "pending";
              break;
            case 1:
              statusString = "sent";
              break;
            case 2:
              statusString = "failed";
              statusMessageString = entry.status_message;
              break;
            case 3:
              statusString = "acked";
              if (entry.status_message !== undefined) {
                var obj = JSON.parse(entry.status_message);
                if (obj['location'] !== undefined) {
                  var latitude = obj['location'].latitude;
                  var longitude = obj['location'].longitude;
                  statusMessageString = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
                } else {
                  statusMessageString = entry.status_message;
                  // <<<<<<< HEAD
                }
                // =======
                //                   break;
                //                 case 5:
                //                   statusString = "aborted";
                //                   statusMessageString = entry.status_message;
                //                   break;
                //                 case 6:
                //                   statusString = "received";
                //                   statusMessageString = entry.status_message;
                //                   break;
                // >>>>>>> master
              }
              break;
            case 4:
              statusString = "ignored";
              statusMessageString = entry.status_message;
              break;
          }
          reportEntries.push({ user: entry.user, status: statusString, statusMessage: statusMessageString });
        }
        var reply = JSON.stringify(reportEntries);
        res.set('Content-Type', 'application/json');
        return res.send(reply);
      });

      // What to do for ALL requests for ALL Paths
      // that are not handled above
      app.all('*', function (req, res) {
        console.log('*** 404 ***');
        console.log('404 for url: ' + req.url);
        console.log('***********');
        return res.type('txt').status(404).send('Endpoint ' + req.url + ' not found');
      });
    } else {
      console.log('env variables not set properly. Check BOT_AUTH_TOKEN, BOT_KEY, BOT_PORT')
    }
  } catch (err) {
    console.log(err);
  }
}

function listen(message) {
  try {
    /*
     * Parses an incoming message and returns and object with command,
     * argument, vGroupID and Sender fields
     */
    var parsedMessage = bot.parseMessage(message);
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
    var isAdmin = parsedMessage.isAdmin;
    var msgtype = parsedMessage.msgtype;
    var personal_vGroupID = "";

    //Go back to dev toolkit and fix
    if (convoType === 'personal')
      personal_vGroupID = vGroupID;

    if (command === '/ack') {
      //sets ack (3) of all messages sent to user ? what does this mean
      var userEmailString = "" + userEmail;
      setMessageStatus("", userEmail, "3", "");
      return;
    }

    //Send the location as an acknowledgement
    if (msgtype === 'location') {
      //acknowledges all messages sent to user
      var userEmailString = "" + userEmail;
      var statusMessage;
      var obj = {};
      obj['location'] = {
        latitude: parsedMessage.latitude,
        longitude: parsedMessage.longitude
      };
      statusMessage = JSON.stringify(obj);
      logger.debug("location statusMessage=" + statusMessage);
      setMessageStatus("", userEmail, "3", statusMessage);
      return;
    }


    logger.debug("convoType=" + convoType);

    // Do not support interaction with Rooms or Groups 
    if (convoType !== 'personal') {
      var reply = strings["one-to-one"];
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      return;
    }

    if (!isAdmin) {
      var reply = strings["not-authorized"];
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      logger.debug(sMessage);
      return;
    }

    if (command === '/version') {
      var reply = strings["version"].replace("%{integrationVersion}", version)
        .replace("%{addonVersion}", dependencies["wickrio_addon"])
        .replace("%{apiVersion}", dependencies["wickrio-bot-api"]);
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
      var reply = bot.getAdminHelp(strings["help"]);
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      user.confirm = '';
      logger.debug(sMessage);
    }


    if (command === '/panel') {
      // Check if this user is an administrator
      var adminUser = bot.myAdmins.getAdmin(user.userEmail);
      // scope this conditional down further
      if (adminUser === undefined) {
        return res.statusCode(401).send('Access denied: ' + user.userEmail + ' is not authorized to broadcast!');
      }
      // check if theres already a client auth code for the user
      // if not, create one


      // generate a random auth code for the session
      var random = generateRandomString(24);
      var message = "Authentication code: " + random;

      // Save the auth key for the wickrUser
      client_auth_codes[user.userEmail] = random;

      // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk 
      // stealing / sharing base 64 token or the given url could allow attackers to mock requests from the allowed resources 
      // should hide base 64 encoded token, or request it in broadcast web instead of sharing it here via url

      // get base64 encoding of basic auth token set up in the bot
      var authEncoded = Buffer.from(bot_api_auth_token).toString('base64')
      var reply = encodeURI(`localhost:4545/?auth=${random}&username=${user.userEmail}&authn=${authEncoded}`)
      var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      user.confirm = '';
      logger.debug(sMessage);
    }

    //TODO Should these be else if statements?? alexL: switch case 
    if (command === '/broadcast') {
      logger.debug("argument:" + argument);
      var reply;
      var uMessage;
      if (!argument) {
        reply = strings["usage"];
        uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      user.broadcast = argument;
      reply = strings["askForAck"];
      user.confirm = 'askForAck';
      //uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      uMessage = replyWithYesNoButtons(vGroupID, reply);
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
    }

    if (command === '/cancel') {
      user.confrim = '';
      var reply = strings["canceled"];
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      securityGroupFlag = false;
      securityGroupsToSend = [];
      securityGroups = [];
      repeatFlag = false;
      voiceMemoFlag = false;;
      fileFlag = false;
      displayName = "";
      askForAckFlag = false;
      return;
    }

    //TODO check if user.confrim for flow!!
    // why
    if (parsedMessage.file) {
      var msg = "";
      if (parsedMessage.isVoiceMemo) {
        msg = strings["voiceMemoBroadcast"];
        user.confirm = 'sendVoiceMemo';
        user.command = '/voicememo';
        user.voiceMemoLocation = parsedMessage.file;
        user.voiceMemoDuration = parsedMessage.voiceMemoDuration;
      } else {
        msg = strings["fileBroadcast"].replace("%{filename}", parsedMessage.filename);
        displayName = parsedMessage.filename;
        user.confirm = 'sendFile';
        user.command = '/file';
      }
      user.filename = parsedMessage.file;
      //var sMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, msg);
      var sMessage = replyWithYesNoButtons(vGroupID, msg);
      return logger.debug(sMessage);
    }

    if (user.confirm === 'sendFile') {
      var reply = "";
      if (affirmativeReply(fullMessage)) {
        user.confirm = 'askForAck';
        fileFlag = true;
        reply = strings["askForAck"];
      } else if (negativeReply(fullMessage)) {
        user.confirm = "";
        fileFlag = false;
        reply = strings["fileNotSent"];
      } else {
        user.confirm = 'sendFile';
        reply = strings["invalidInput"];
      }
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'sendVoiceMemo') {
      var reply = "";
      if (affirmativeReply(fullMessage)) {
        user.confirm = 'askForAck';
        voiceMemoFlag = true;
        logger.debug("voiceMEmoFlag: " + voiceMemoFlag);
        reply = strings["askForAck"];
      } else if (negativeReply(fullMessage)) {
        user.confirm = "";
        voiceMemoFlag = false;
        reply = strings["voiceMemoNotSent"];
      } else {
        user.confirm = 'sendVoiceMemo';
        reply = strings["invalidInput"];
      }
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'askForAck' && !fullMessage.startsWith("/broadcast")) {
      if (affirmativeReply(fullMessage)) {
        askForAckFlag = true;
      } else if (negativeReply(fullMessage)) {
        askForAckFlag = false;
      } else {
        user.confirm === 'askForAck';
        var reply = strings["invalidInput"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      user.confirm = 'whichGroup';
      var getGroups = WickrIOAPI.cmdGetSecurityGroups();
      securityGroups = JSON.parse(getGroups);
      var groupMessage = "";
      var groupList = [];
      for (var i = 0; i < securityGroups.length; i++) {
        logger.debug(securityGroups[i].name);
        //TODO when would size be undefinded?? Should this just be the all option??
        if (securityGroups[i].size === undefined) {
          groupMessage = groupMessage + "(" + i + ") " + securityGroups[i].name + "\n";
          groupList.push(securityGroups[i].name);
        } else {
          groupMessage = groupMessage + "(" + i + ") " + securityGroups[i].name + " (users: " + securityGroups[i].size + ")\n";
          groupList.push(securityGroups[i].name);
        }
      }
      reply = strings["whichGroup"].replace("%{securityGroupList}", groupMessage);
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      //Send an array of buttons not just strings.
      groupList.push("all");
      //var uMessage = replyWithButtons(vGroupID, reply);
    } else if (user.confirm === 'whichGroup') {
      var reply;
      if (fullMessage.toLowerCase() === 'all') {
        securityGroupFlag = false;
        if (voiceMemoFlag || fileFlag) {
          sendMessage(user, vGroupID, userEmail);
          return;
        } else {
          //TODO Should we confirm sending even if to the whole network??
          user.confirm = "askRepeat";
          // TODO we could make this question how many times send message so not having to ask repeat and ask number of repeats??
          //reply = "Message will be sent to network of " + userNumber + "\nWould you like to repeat this broadcast message?";
          reply = strings["askRepeat"];
        }
      } else {
        user.confirm = "confirmSecurityGroups";
        var groups = fullMessage.split(/[^0-9]/);
        var groupsString = "";
        var reply;
        securityGroupsToSend = [];
        for (var group of groups) {
          var index = parseInt(group);
          if (index >= 0 && index < securityGroups.length) {
            securityGroupsToSend.push(securityGroups[index].id);
            groupsString = groupsString + securityGroups[index].name + "\n";
            securityGroupFlag = true;
            reply = strings["confirmGroups"].replace("%{groupsList}", groupsString);
            //TODO what if some indexes are good and others are not??
          } else {
            user.confirm = 'whichGroup';
            reply = strings["invalidIndex"].replace("%{index}", index);
            var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
            logger.error("index not in bounds" + index);
            securityGroupsToSend = [];
            return;
          }
        }
      }
      logger.debug("Groups to send!: " + securityGroupsToSend);
      var uMessage = replyWithYesNoButtons(vGroupID, reply);
    } else if (user.confirm === 'confirmSecurityGroups') {
      var reply;
      if (affirmativeReply(fullMessage)) {
        if (voiceMemoFlag || fileFlag) {
          sendMessage(user, vGroupID, userEmail);
        } else {
          user.confirm = "askRepeat";
          reply = strings["askRepeat"];
          replyWithYesNoButtons(vGroupID, reply);
        }
      } else if (negativeReply(fullMessage)) {
        user.confirm = 'whichGroup';
        //TODO should buttons go here?
        reply = strings["whichGroupAgain"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      } else {
        user.confirm = 'confirmSecurityGroups';
        reply = strings["invalidInput"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      }
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
          reply = strings["activeRepeat"];
        } else {
          user.confirm = "timesRepeat";
          reply = strings["timesRepeat"];
        }
      } else {
        user.confirm = "askRepeat";
        reply = strings["askRepeat"];
      }
      // TODO turn this into reply yes no
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'activeRepeat') {
      if (affirmativeReply(fullMessage)) {
        user.cronJobActive = false;
        if (job) {
          job.stop();
        }
        user.confirm = "askRepeat";
        listen(message);
      } else if (negativeReply(fullMessage)) {
        // Do Nothing??
      } else {
        user.confirm = "activeRepeat";
        reply = string["invalidInput"];
      }
    } else if (user.confirm === 'timesRepeat') {
      user.confirm = "yesRepeat";
      if (!isInt(fullMessage) || parseInt(fullMessage) === 0) {
        user.confirm = "timesRepeat";
        var reply = strings["invalidNumberValue"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      user.repeat = parseInt(fullMessage);
      user.count = 0;
      var reply = strings["repeatFrequency"];
      var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
    } else if (user.confirm === 'yesRepeat') {
      var now = new Date();
      var minutes = now.getMinutes();
      minutes = minutes.toString();
      if (minutes.length === 2)
        minutes = minutes.charAt(1);
      //Do we need the current time to make this work?? Idts
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
      } else {
        logger.debug('ELSE')
        user.confirm = "yesRepeat";
        var reply = strings["invalidFrequency"];
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
        return;
      }
      repeatFlag = true;
      sendMessage(user, vGroupID, userEmail);
      //TODO IMPORTANT Fix this! 
      //TODO just use one no more array for message id entries!!
    } else if (user.confirm === 'askMessageId' && fullMessage != "/status") {
      //Subtract one to account for 0 based indexes
      var index = parseInt(fullMessage) - 1;
      var messageIdEntries = getMessageEntries(userEmail, 5);
      var length = Math.min(messageIdEntries.length, 5);
      var reply = "";
      if (isNaN(index) || index < 0 || index >= length) {
        user.confirm = 'askMessageId';
        reply = strings["wrongId"].replace("%{index}", (index + 1)).replace("%{length}", length);
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      } else {
        user.confirm = '';
        reply += getStatus(messageIdEntries[index].message_id, "summary", false);
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      }
    } else if (user.confirm === 'idForReport' && fullMessage != "/report") {
      //Subtract one to account for 0 based indexes
      var index = parseInt(fullMessage) - 1;
      var reply = "";
      //TODO make this a global~?
      var messageIdEntries = getMessageEntries(userEmail, 5);
      var length = Math.min(messageIdEntries.length, 5);
      if (isNaN(index) || index < 0 || index >= length) {
        user.confirm = 'idForReport';
        reply = strings["wrongId"].replace("%{index}", (index + 1)).replace("{%length}", length);
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      } else {
        user.confirm = '';
        var path = getCSVReport(messageIdEntries[index].message_id);
        var uMessage = WickrIOAPI.cmdSendRoomAttachment(vGroupID, path, path);
        logger.debug(uMessage);
      }
    } else if (user.confirm === 'idForAbort' && fullMessage != "/abort") {
      //Subtract one to account for 0 based indexes
      var index = parseInt(fullMessage) - 1;
      var messageIdEntries = getMessageEntries(userEmail, 5);
      var length = Math.min(messageIdEntries.length, 5);
      var reply = "";
      if (isNaN(index) || index < 0 || index >= length) {
        user.confirm = 'idForAbort';
        reply = strings["wrongId"].replace("%{index}", (index + 1)).replace("%{length}", length);
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      } else {
        user.confirm = '';
        reply += WickrIOAPI.cmdCancelMessageID(messageIdEntries[index].message_id);
        var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
      }
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

function cronJob(job, cronInterval, user, broadcast, sgFlag, ackFlag, securityGroupsToSend, userEmail, target) {
  job = new CronJob(cronInterval, function () {
    var currentDate = new Date();
    var jsonDateTime = currentDate.toJSON();
    var bMessage;
    var messageId = updateLastID();
    logger.debug("CronJob", sgFlag);
    var broadcastMsgToSend = broadcast;
    if (ackFlag) {
      broadcastMsgToSend = broadcastMsgToSend + "\nPlease acknowledge this message by replying with /ack";
    }
    broadcastMsgToSend = broadcastMsgToSend + "\n\nBroadcast message sent by: " + userEmail;
    if (sgFlag) {
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
    var reply = strings["repeatMessageSent"].replace("%{count}", (user.count + 1));
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
function asyncStatus(messageId, groupId) {
  logger.debug("asyncStatus we are in");
  var asyncJob = new CronJob("*/30 * * * * *", function () {
    var statusObj = getStatus(messageId, "summary", true);
    var uMessage = WickrIOAPI.cmdSendRoomMessage(groupId, statusObj.statusString);
    if (statusObj.complete) {
      logger.debug("ending job for complete string");
      return asyncJob.stop();
    }
  });
  asyncJob.start();
}

function affirmativeReply(message) {
  return message.toLowerCase() === 'yes' || message.toLowerCase() === 'y';
}

function negativeReply(message) {
  return message.toLowerCase() === 'no' || message.toLowerCase() === 'n';
}

function replyWithYesNoButtons(vGroupID, reply) {
  var button1 = {
    type: "message",
    text: "Yes",
    message: "yes"
  };
  var button2 = {
    type: "message",
    text: "No",
    message: "no"
  };
  var buttons = [button1, button2];

  //  replyWithButtons(reply + "NETWORK" , buttons);
  return WickrIOAPI.cmdSendRoomMessage(vGroupID, reply, "", "", "", [], buttons);
  //return WickrIOAPI.cmdSendNetworkMessage(vGroupId, "", "", messageID, flags, buttons);
}

function replyWithButtons(message, buttonList) {
  var buttons = [];
  for (var button of buttonList) {
    var buttonObj = {
      type: "message",
      text: button,
      message: button
    }
    buttons.push(buttonObj);
  }
  //return  WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageID, [], buttons);
  return WickrIOAPI.cmdSendNetworkMessage(message, "", "", "1", [], buttons);
}

function isInt(value) {
  return !isNaN(value) && (function (x) { return (x | 0) === x; })(parseFloat(value))
}

function sendMessage(user, vGroupID, userEmail) {
  var reply = "";
  var broadcast = user.broadcast;
  var broadcastMsgToSend = user.broadcast + "\n\nBroadcast message sent by: " + userEmail;
  var broadcastRepeat = user.broadcast;
  var sentby = "Broadcast message sent by: " + userEmail;
  var askForAckString = "";
  if (askForAckFlag) {
    broadcastMsgToSend = broadcastMsgToSend + "\nPlease acknowledge this message by replying with /ack";
    sentby = sentby + "\nPlease acknowledge this message by replying with /ack";
  }
  var messageID = updateLastID();
  var target;
  //TODO the nice ternary operator maybe??
  if (securityGroupsToSend.length < 1 || securityGroupsToSend == undefined) {
    target = "NETWORK";
  } else {
    target = securityGroupsToSend.join();
  }
  logger.debug("this is the messageID in the sMessage func" + messageID);
  if (securityGroupFlag) {
    if (voiceMemoFlag) {
      var duration = "" + user.voiceMemoDuration;
      var sendVoiceMemo = WickrIOAPI.cmdSendSecurityGroupVoiceMemo(securityGroupsToSend, user.voiceMemoLocation, "VoiceMemo", duration, "", "", messageID, sentby);
      logger.debug(sendVoiceMemo);
      //optionally add to which groups?
      reply = strings["voiceMemoSentSG"];
    } else if (fileFlag) {
      var send = WickrIOAPI.cmdSendSecurityGroupAttachment(securityGroupsToSend, user.filename, displayName, "", "", messageID, sentby);
      logger.debug(send)
      reply = strings["fileSentSG"];
    } else {
      if (repeatFlag) {
        repeatMessage(broadcastRepeat, user, vGroupID, messageID, userEmail, target);
      } else {
        var send = WickrIOAPI.cmdSendSecurityGroupMessage(broadcastMsgToSend, securityGroupsToSend, "", "", messageID);
        logger.debug("this is send:" + send)
        reply = strings["messageSentSG"];
      }
    }
  } else {
    if (voiceMemoFlag) {
      var duration = "" + user.voiceMemoDuration;
      var sendVoiceMemo = WickrIOAPI.cmdSendNetworkVoiceMemo(user.voiceMemoLocation, "VoiceMemo", duration, "", "", messageID, sentby);
      logger.debug(sendVoiceMemo);
      reply = strings["voiceMemoSent"];
    } else if (fileFlag) {
      logger.debug("This is the sentby" + sentby);
      var send = WickrIOAPI.cmdSendNetworkAttachment(user.filename, displayName, "", "", messageID, sentby);
      logger.debug("this is send" + send)
      reply = strings["fileSent"];
    } else {
      if (repeatFlag) {
        repeatMessage(broadcastRepeat, user, vGroupID, messageID, userEmail, target);
      } else {
        logger.debug("This is messageID:" + messageID + ":");
        var bMessage = WickrIOAPI.cmdSendNetworkMessage(broadcastMsgToSend, "", "", messageID);
        logger.debug("This is bMessage: " + bMessage)
        reply = strings["messageSent"];
      }
    }
  }
  //what if message fails?
  if (!repeatFlag) {
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
  } else if (voiceMemoFlag) {
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
  if (securityGroupFlag) {
    messageID = "" + messageID;
    bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(broadcastMsgToSend, securityGroupsToSend, "", "", messageID);
  } else {
    messageID = "" + messageID;
    bMessage = WickrIOAPI.cmdSendNetworkMessage(broadcastMsgToSend, "", "", messageID);
  }
  logger.debug(bMessage)


  // send message
  var reply = strings["repeatMessageSent"].replace("%{count}", (user.count + 1));
  var uMessage = WickrIOAPI.cmdSendRoomMessage(vGroupID, reply);
  user.count += 1;
  cronJob(job, cronInterval, user, broadcast, securityGroupFlag, askForAckFlag, securityGroupsToSend, userEmail, target);
}

function getMessageEntries(userEmail, max) {
  var messageIdEntries = []
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
function getStatus(messageID, type, async) {
  //TODO Here we need which Message??
  messageID = "" + messageID;
  var statusData;
  try {
    statusData = WickrIOAPI.cmdGetMessageStatus(messageID, type, "0", "1000");
  } catch (err) {
    if (async) {
      var returnObj = {
        statusString: "No data found for that message",
        complete: true
      };
      return returnObj;
    } else {
      return "No data found for that message";
    }
  }
  var messageStatus = JSON.parse(statusData);
  var statusString;

  statusString = strings["messageStatus"].replace("%{num2send}", messageStatus.num2send).replace("%{sent}", messageStatus.sent).replace("%{acked}", messageStatus.acked).replace("%{pending}", messageStatus.pending).replace("%{failed}", messageStatus.failed).replace("%{received}", messageStatus.received).replace("%{aborted}", messageStatus.aborted).replace("%{ignored}", messageStatus.ignored);
  if (messageStatus.ignored !== undefined) {
    statusString = statusString + strings["messageStatusIgnored"].replace("%{ignored}", messageStatus.ignored);
  }

  logger.debug("here is the message status" + statusString);
  if (async) {
    var complete = messageStatus.pending === 0;
    var returnObj = {
      statusString: statusString,
      complete: complete
    };
    return returnObj;
  } else {
    return statusString;
  }
}

function updateLastID() {
  try {
    var id;
    if (fs.existsSync('last_id.json')) {
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
  } catch (err) {
    logger.error(err);
  }
}

function writeToMessageIdDB(messageId, sender, target, dateSent, messageContent) {
  logger.debug("inside~writeToMessageIdDB");
  // what does this do? assuming it sends a broadcast without a securty group 
  WickrIOAPI.cmdAddMessageID(messageId, sender, target, dateSent, messageContent);
}

function setMessageStatus(messageId, userId, status, statusMessage) {
  var reply = WickrIOAPI.cmdSetMessageStatus(messageId, userId, status, statusMessage);
  var userArray = [userId];
  var uMessage = WickrIOAPI.cmdSend1to1Message(userArray, reply);
}

function get_LastID() {
  var data = fs.readFileSync('last_id.json');
  return JSON.parse(data);
}

function getCSVReport(messageId) {
  var inc = 0;
  var csvArray = [];
  while (true) {
    var statusData = WickrIOAPI.cmdGetMessageStatus(messageId, "full", "" + inc, "1000");
    var messageStatus = JSON.parse(statusData);
    for (var entry of messageStatus) {
      var statusMessageString = "";
      var statusString = "";
      switch (entry.status) {
        case 0:
          statusString = "pending";
          break;
        case 1:
          statusString = "sent";
          break;
        case 2:
          statusString = "failed";
          statusMessageString = entry.status_message;
          break;
        case 3:
          statusString = "acked";
          if (entry.status_message !== undefined) {
            var obj = JSON.parse(entry.status_message);
            if (obj['location'] !== undefined) {
              var latitude = obj['location'].latitude;
              var longitude = obj['location'].longitude;
              statusMessageString = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
            } else {
              statusMessageString = entry.status_message;
            }
          }
          break;
        case 4:
          statusString = "ignored";
          statusMessageString = entry.status_message;
          break;
        case 5:
          statusString = "aborted";
          statusMessageString = entry.status_message;
          break;
        case 6:
          statusString = "received";
          statusMessageString = entry.status_message;
          break;
      }
      csvArray.push({ user: entry.user, status: statusString, statusMessage: statusMessageString });
    }
    if (messageStatus.length < 1000) {
      break;
    }
    inc++;
  }
  var now = new Date();
  var dateString = now.getDate() + "-" + (now.getMonth() + 1) + "-" + now.getFullYear() + "_" + now.getHours() + "_" + now.getMinutes() + "_" + now.getSeconds();

  var path = process.cwd() + "/attachments/report-" + dateString + ".csv";
  writeCSVReport(path, csvArray);
  return path;
}

function writeCSVReport(path, csvArray) {
  var csvWriter = createCsvWriter({
    path: path,
    header: [
      { id: 'user', title: 'USER' },
      { id: 'status', title: 'STATUS' },
      { id: 'statusMessage', title: 'MESSAGE' }
    ]
  });
  csvWriter.writeRecords(csvArray)
    .then(() => {
      logger.debug('...Done');
    });
}

//Basic function to validate credentials for example
function checkCreds(authToken) {
  try {
    var valid = true;
    const authStr = Buffer.from(authToken, 'base64').toString();
    //implement authToken verification in here
    if (authStr !== bot_api_auth_token) {
      valid = false;
      console.log('Access denied: invalid basic-auth token.')
    }
    return valid;
  } catch (err) {
    console.log(err);
  }
}

function generateRandomString(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function isJson(str) {
  try {
    str = JSON.parse(str);
  } catch (e) {
    return false;
  }
  return str;
}

main();
