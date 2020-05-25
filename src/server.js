import bodyParser from 'body-parser';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer'
import jwt from "jsonwebtoken"
import {
  bot,
  WickrIOAPI,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
  BOT_KEY,
  updateLastID,
  // cronJob
} from './constants';
import strings from './strings'


const app = express();
app.use(helmet()); //security http headers

// set upload destination for attachments sent to broadcast with multer 
var upload = multer({ dest: 'attachments/' })

// app.listen(bot_port, () => {
//   console.log('We are live on ' + bot_port);
// });

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
app.use(express.static('wickrio-bot-web/public'))


app.use((error, req, res, next) => {

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
app.options("/*", (req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Origin', 'http://localhost:8000');

  res.sendStatus(200)
});

app.all("/*", (req, res, next) => {
  res.header('Access-Control-Allow-Headers', 'Origin, Content-Type, Authorization, Content-Length, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
  next()
});

var endpoint = "/WickrIO/V1/Apps/" + BOT_KEY.value;

const checkAuth = (req, res, next) => {
  res.set('Authorization', 'Basic base64_auth_token');
  res.set('Content-Type', 'application/json');

  // Gather the jwt access token from the request header
  // const authHeader = req.get('Authorization');
  const authHeader = req.headers['authorization']

  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic jwt"'); // if there isn't any token

  jwt.verify(token, BOT_AUTH_TOKEN.value, (err, user) => {
    if (err) {
      console.log(err)
      console.log("err: " + err.message)
      return res.status(403).send(err.message)
    }

    var adminUser = bot.myAdmins.getAdmin(user.email);
    if (adminUser === undefined) {
      return res.status(401).send('Access denied: ' + user.email + ' is not authorized to broadcast!');
    }

    // Check if the authCode is valid for the input user
    var dictAuthCode = client_auth_codes[user.email];
    if (dictAuthCode === undefined || user.session != dictAuthCode) {
      return res.status(401).send('Access denied: invalid user authentication code.');
    }
    logger.debug({ user })
    req.user = user
    next()
  })
}

app.get(endpoint + "/Authenticate", checkAuth, (req, res) => {
  try {
    console.log(req.user);
    res.json(req.user)
  } catch (err) {
    console.log(err);
    res.statusCode = 400;
    res.send(err.toString());
  }
});

const sendBroadcast = (broadcast, wickrUser) => {
  try {
    var jsonDateTime = new Date().toJSON();
    var bMessage;
    var reply
    var messageID = updateLastID();
    var messageId = "" + messageID
    let { file, repeat, message, security_group } = broadcast

    // send to securtiy groups, with and without files, and repeats
    if (security_group != false && file && repeat) {
      if (security_group.length === 0) return "Security Group length invalid."
      broadcast.count = 0
      // console.log(repeat)
      // validate cronjob interval
      job = new CronJob(repeat, function () {
        logger.debug("CronJob", repeat);

        WickrIOAPI.cmdAddMessageID(messageId, wickrUser, security_group.toString(), jsonDateTime, message);
        bMessage = WickrIOAPI.cmdSendSecurityGroupAttachment(security_group, "../integration/wickrio-broadcast-bot/".concat(file.path), file.originalname, "", "", messageID, 'sentby ' + wickrUser);
        logger.debug(bMessage);

        bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(message, security_group, "", "", messageID);
        logger.debug(bMessage);

        reply = strings["repeatMessageSent"].replace("%{count}", (broadcast.count + 1));
        console.log(reply)

        // Will this stay the same or could user be reset?? I believe only can send one repeat message
        broadcast.count += 1;
        if (broadcast.count > repeat) {
          broadcast.cronJobActive = false;
          return job.stop();
        }
      });
      job.start();
    } else if (security_group != false && !file && repeat) {
      if (security_group.length === 0) return "Security Group length invalid."
      broadcast.count = 0
      // console.log(repeat)
      // validate cronjob interval
      job = new CronJob(repeat, function () {
        logger.debug("CronJob", repeat);
        WickrIOAPI.cmdAddMessageID(messageId, wickrUser, security_group.toString(), jsonDateTime, message);

        bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(message, security_group, "", "", messageID);
        logger.debug(bMessage);

        reply = strings["repeatMessageSent"].replace("%{count}", (broadcast.count + 1));
        console.log(reply)

        // Will this stay the same or could user be reset?? I believe only can send one repeat message
        broadcast.count += 1;
        if (broadcast.count > repeat) {
          broadcast.cronJobActive = false;
          return job.stop();
        }
      });
      job.start();
    } else if (security_group != false && !file && !repeat) {
      if (security_group.length === 0) return "Security Group length invalid."
      broadcast.count = 0

      WickrIOAPI.cmdAddMessageID(messageId, wickrUser, security_group.toString(), jsonDateTime, message);

      bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(message, security_group, "", "", messageID);
      logger.debug(bMessage);

      reply = strings["repeatMessageSent"].replace("%{count}", (broadcast.count + 1));
      console.log(reply)

    } else if (security_group != false && file && !repeat) {
      if (security_group.length === 0) return "Security Group length invalid."
      broadcast.count = 0

      WickrIOAPI.cmdAddMessageID(messageId, wickrUser, security_group.toString(), jsonDateTime, message);

      bMessage = WickrIOAPI.cmdSendSecurityGroupAttachment(security_group, "../integration/wickrio-broadcast-bot/".concat(file.path), file.originalname, "", "", messageID, 'sentby ' + wickrUser);
      logger.debug(bMessage);

      bMessage = WickrIOAPI.cmdSendSecurityGroupMessage(message, security_group, "", "", messageID);
      logger.debug(bMessage);
      reply = strings["repeatMessageSent"].replace("%{count}", (broadcast.count + 1));
      console.log(reply)
    } else if (security_group === false && file && repeat) {
      job = new CronJob(repeat, function () {
        logger.debug("CronJob", repeat)
        bMessage = WickrIOAPI.cmdSendNetworkAttachment(`../integration/wickrio-broadcast-bot/${file.path}`, file.originalname, "", "", messageID, message);
        logger.debug(bMessage)

        bMessage = WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageID);
        logger.debug(bMessage);

        reply = strings["repeatMessageSent"].replace("%{count}", (broadcast.count + 1));

        //Will this stay the same or could user be reset?? I believe only can send one repeat message
        broadcast.count += 1;
        if (broadcast.count > repeat) {
          broadcast.cronJobActive = false;
          return job.stop();
        }
      });
      job.start();
    } else if (security_group === false && !file & repeat) {
      job = new CronJob(repeat, function () {
        logger.debug("CronJob", repeat);
        bMessage = WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageID);
        logger.debug(bMessage);
        reply = strings["repeatMessageSent"].replace("%{count}", (user.count + 1));

        //Will this stay the same or could user be reset?? I believe only can send one repeat message
        user.count += 1;
        if (user.count > user.repeat) {
          user.cronJobActive = false;
          return job.stop();
        }
      });
      job.start();
    } else if (security_group === false && !file & !repeat) {
      bMessage = WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageID);

      console.log('sending to entire network!');
      console.log({ bMessage });
    } else if (security_group === false && file & !repeat) {
      logger.debug("This is sentby" + wickrUser);
      var bMessage = WickrIOAPI.cmdSendNetworkAttachment(`../integration/wickrio-broadcast-bot/${file.path}`, file.originalname, "", "", messageID, message);
      logger.debug("this is sent" + bMessage)
      bMessage = WickrIOAPI.cmdSendNetworkMessage(message, "", "", messageID);
      logger.debug("this is sent" + bMessage)
      reply = strings["fileSent"];
    }
    // return sent broadcast
    console.log(bMessage);
    return bMessage
  } catch (err) {
    console.log(err);
    return (err.toString())
  }
}

app.post(endpoint + "/Broadcast", [checkAuth, upload.single('attachment')], (req, res) => {
  // typecheck and validate parameters
  let { message, acknowledge, security_group, repeat_num, freq_num } = req.body

  // validate arguments, append message.
  if (!message) return res.send("Broadcast message missing from request.");

  let broadcast = {}
  broadcast.file = req.file || false
  broadcast.repeat_num = repeat_num || false
  broadcast.freq_num = freq_num || false
  acknowledge === true || acknowledge == 'true' ?
    broadcast.message = message + `\n Broadcast sent by: ${req.user.email} \n Please acknowledge you received this message by repling with /ack` :
    broadcast.message = message + `\n Broadcast sent by: ${req.user.email}`

  if (security_group.includes(',')) {
    security_group = security_group.split(',')
  }
  broadcast.security_group = security_group

  if (security_group == 'false') broadcast.security_group = false
  else if (typeof security_group === "string") broadcast.security_group = [security_group]

  let response = sendBroadcast(broadcast, req.user.email)

  // todo: send status on error
  res.send(response)
});

app.get(endpoint + "/SecGroups", checkAuth, (req, res) => {
  try {
    // how does cmdGetSecurityGroups know what user to get security groups for?
    // could we get securityg groups for a targeted user?
    var response = JSON.parse(WickrIOAPI.cmdGetSecurityGroups())
    res.json(response);
  } catch (err) {
    console.log(err);
    res.statusCode = 400;
    res.type('txt').send(err.toString());
  }
});

app.get(endpoint + "/Status", checkAuth, (req, res) => {

  // need to dynamically get last x records, what if there are over 1000 messages, why give back 1000 records if we dont need to
  // if user hasn't sent a message in the last 1000 messages, it will show zero messages unless we search a larger index
  // too many calls, wickrio api should support a single status call for x records including sender and message content
  var tableDataRaw = WickrIOAPI.cmdGetMessageIDTable("0", "1000");

  var messageIdEntries = JSON.parse(tableDataRaw).filter(entry => {
    return entry.sender == req.user.email
  });
  messageIdEntries.map(entry => {
    let contentData = WickrIOAPI.cmdGetMessageIDEntry(entry.message_id);
    entry.message = JSON.parse(contentData).message;
  })
  // 

  var reply = {};
  if (messageIdEntries.length < 1) {
    reply.data = []
    reply.error = "no broadcasts yet"
    // reply = strings["noPrevious"];
  } else {
    reply.data = messageIdEntries
  }
  // 


  return res.json(reply);
});

app.get(endpoint + "/Status/:messageID", checkAuth, (req, res) => {
  // validate message id
  var statusData = WickrIOAPI.cmdGetMessageStatus(req.params.messageID, "summary", "0", "1000");
  var reply = statusData;
  return res.send(reply);
});

app.get(endpoint + "/Report/:messageID/:page/:size", checkAuth, (req, res) => {
  // validate params
  var reportEntries = [];

  var statusData = WickrIOAPI.cmdGetMessageStatus(req.params.messageID, "full", req.params.page, req.params.size);
  var messageStatus = JSON.parse(statusData);
  for (let entry of messageStatus) {
    var statusMessageString = "";
    var statusString = "";
    var sentDateString = "";
    var readDateString = "";
    if (entry.sent_datetime !== undefined)
      sentDateString = entry.sent_datetime;
    if (entry.read_datetime !== undefined)
      readDateString = entry.read_datetime;
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
    reportEntries.push(
      {
        user: entry.user,
        status: statusString,
        statusMessage: statusMessageString,
        sentDate: sentDateString,
        readDate: readDateString
      });
  }
  var reply = JSON.stringify(reportEntries);
  res.set('Content-Type', 'application/json');
  return res.send(reply);
});

// What to do for ALL requests for ALL Paths
// that are not handled above
app.all('*', (req, res) => {
  console.log('*** 404 ***');
  console.log('404 for url: ' + req.url);
  console.log('***********');
  return res.type('txt').status(404).send('Endpoint ' + req.url + ' not found');
});

export default app
