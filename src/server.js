import bodyParser from 'body-parser';
import express from 'express';
import helmet from 'helmet';
import multer from 'multer'
import jwt from "jsonwebtoken"
import {
  bot,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
  BOT_PORT,
  BOT_KEY,
  updateLastID,
  // cronJob
} from './helpers/constants';
import APIService from './services/api-service'
import BroadcastService from './services/broadcast-service';
import strings from './strings'

// set upload destination for attachments sent to broadcast with multer 
const startServer = () => {
  var upload = multer({ dest: 'attachments/' })
  const app = express();
  app.use(helmet()); //security http headers

  app.listen(BOT_PORT.value, () => {
    console.log('We are live on ' + BOT_PORT.value);
  });

  // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false }));
  // parse application/json
  app.use(bodyParser.json());
  app.use(express.static('public'))


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

  const base = "/WickrIO/V1/Apps/"
  var endpoint = base + BOT_KEY.value;

  function checkCreds(authToken) {
    try {
      var valid = true;
      const authStr = Buffer.from(authToken, 'base64').toString();
      //implement authToken verification in here
      if (authStr !== BOT_AUTH_TOKEN.value)
        valid = false;
      return valid;
    } catch (err) {
      console.log(err);
    }
  }

  function generateRandomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  app.get(base + "Authenticate/:wickrUser/:authcode", (req, res) => {
    try {
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
        // expecting
        // Basic: BOT_AUTH_TOKEN base64
        return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Authorization: Basic base64_auth_token"');
      }
      if (!checkCreds(authToken)) {
        return res.status(401).send('Access denied: invalid basic-auth token.');
      } else {
        let wickrUser = req.params.wickrUser

        if (typeof wickrUser !== 'string')
          return res.status(400).send('Bad request: WickrUser must be a string.');

        // Check if this user is an administrator
        var adminUser = bot.myAdmins.getAdmin(wickrUser);
        if (adminUser === undefined) {
          return res.status(401).send('Access denied: ' + wickrUser + ' is not authorized to broadcast!');
        }


        var random = generateRandomString(24);
        client_auth_codes[wickrUser] = random; // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk 
        // send token in url, used for calls to receive data, send messages

        var token = jwt.sign({
          'email': wickrUser,
          'session': random,
        }, BOT_AUTH_TOKEN.value, { expiresIn: '1800s' });

        // what will the deploy env be
        var reply = encodeURI(`token=${token}`)
        return res.send(reply);
      }
    } catch (err) {
      console.log(err);
      res.statusCode = 400;
      res.send(err.toString());
    }
  });

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

  app.post(endpoint + "/Broadcast", [checkAuth, upload.single('attachment')], (req, res) => {
    // typecheck and validate parameters
    let { message, acknowledge, security_group, repeat_num, freq_num } = req.body

    const newBroadcast = new BroadcastService()

    // validate arguments, append message.
    if (!message) return res.send("Broadcast message missing from request.");

    // let broadcast = {}
    // set user email without plus
    newBroadcast.setUserEmail(req.user.email)
    if (req.file === undefined)
      newBroadcast.setFile('')
    else
      newBroadcast.setFile(req.file)

    // set repeats and durations


    acknowledge === true || acknowledge == 'true' ?
      newBroadcast.setMessage(message + `\n Broadcast sent by: ${req.user.email} \n Please acknowledge you received this message by repling with /ack`) :
      newBroadcast.setMessage(message + `\n Broadcast sent by: ${req.user.email}`)

    if (security_group.includes(',')) {
      security_group = security_group.split(',')
      console.log({ security_group })
      newBroadcast.setSecurityGroups(security_group)
    }

    // if (security_group == 'false') broadcast.security_group = false
    // else if (typeof security_group === "string") broadcast.security_group = [security_group]

    let response = newBroadcast.broadcastMessage()

    // todo: send status on error
    res.send(response)
  });

  app.get(endpoint + "/SecGroups", checkAuth, (req, res) => {
    try {
      // how does cmdGetSecurityGroups know what user to get security groups for?
      // could we get securityg groups for a targeted user?
      var response = APIService.getSecurityGroups()
      res.json(response)
    } catch (err) {
      console.log(err);
      res.statusCode = 400;
      res.type('txt').send(err.toString());
    }
  });

  app.get(endpoint + "/Status", checkAuth, async (req, res) => {

    // need to dynamically get last x records user sent, what if there are over 1000 messages, why give back 1000 records if we dont need to
    // if user hasn't sent a message in the last 1000 messages, it will show zero messages unless we search a larger index
    // too many calls, wickrio api should support a single status call for x records including sender and message content
    const status = await getStatus(req.user.email)
    res.json(status)
  });

  const mapEntries = (messageIdEntries) => {
    messageIdEntries?.map(async entry => {
      let contentData = JSON.parse(APIService.getMessageIDEntry(entry.message_id));
      entry.message = contentData.message
      let statusdata = await APIService.getMessageStatus(entry.message_id, 'full', "0", "20")
      const parsedstatus = JSON.parse(statusdata)
      entry.summary = {}
      entry.test = "test"
      entry.summary.pending = 0
      entry.summary.sent = 0
      entry.summary.failed = 0
      entry.summary.ack = 0
      entry.status = parsedstatus

      parsedstatus?.map(user => {
        if (user.status == 0) { entry.summary.pending += 1 }
        else if (user.status == 1) { entry.summary.sent += 1 }
        else if (user.status == 2) { entry.summary.failed += 1 }
        else if (user.status == 3) { entry.summary.ack += 1 }
      })

    })
    return messageIdEntries
  }

  const getStatus = async (email) => {
    var tableDataRaw = APIService.getMessageIDTable("0", "1000");

    var messageIdEntries = JSON.parse(tableDataRaw).filter(entry => {
      return entry.sender == email
    });

    try {
      const builtStatus = await mapEntries(messageIdEntries)

      var reply = {};
      if (builtStatus.length < 1) {
        reply.data = []
        reply.error = "no broadcasts yet"
        // reply = strings["noPrevious"];
      } else {
        reply.data = builtStatus
      }
      return reply
    } catch (e) {
      console.log(e)
      return e
    }
  }

  app.get(endpoint + "/Status/:messageID", checkAuth, (req, res) => {
    // validate message id
    // need to dynamically get last x users
    var statusData = APIService.cmdGetMessageStatus(req.params.messageID, "full", "0", "1000");
    var reply = statusData;
    return res.send(reply);
  });

  app.get(endpoint + "/Report/:messageID/:page/:size", function (req, res) {
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

    var statusData = APIService.cmdGetMessageStatus(req.params.messageID, "full", req.params.page, req.params.size);
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
          statusString = "read";
          statusMessageString = entry.status_message;
          break;
        case 7: // NOT SUPPORTED YET
          statusString = "delivered";
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

}


export default startServer
