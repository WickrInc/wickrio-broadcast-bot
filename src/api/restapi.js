import multer from 'multer'
import jwt from "jsonwebtoken"
import {
  bot,
  client_auth_codes,
  logger,
  BOT_AUTH_TOKEN,
  // cronJob
} from '../helpers/constants';
import APIService from '../services/api-service'
import BroadcastService from '../services/broadcast-service';

// set upload destination for attachments sent to broadcast with multer 
const useRESTRoutes = (app) => {
  var upload = multer({ dest: 'attachments/' })
  // parse application/x-www-form-urlencoded

  const endpoint = "/WickrIO/V1/Apps/Broadcast"

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

  app.get(endpoint + "/Authenticate/:wickrUser", (req, res) => {
    try {
      res.set('Content-Type', 'text/plain');
      res.set('Authorization', 'Bearer base64_auth_token');
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
        // Bearer: BOT_AUTH_TOKEN base64
        return res.status(401).send('Access denied: invalid Authorization Header format. Correct format: "Bearer JWT"');
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
        client_auth_codes[wickrUser] = random;
        // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk 

        var token = jwt.sign({
          'email': wickrUser,
          'session': random,
        }, BOT_AUTH_TOKEN.value, { expiresIn: '1800s' });

        // send token in url, used for authorization to use routes
        // what will the deploy env be
        let reply = {}
        reply.token = token
        return res.send(reply);
      }
    } catch (err) {
      console.log(err);
      res.statusCode = 400;
      res.send(err.toString());
    }
  });

  app.get(endpoint + "/Authenticate", checkAuth, (req, res) => {
    try {
      let reply = { data: req.user }
      res.json(reply)
    } catch (err) {
      console.log(err);
      res.statusCode = 400;
      res.send(err.toString());
    }
  });

  app.post(endpoint + "/Message", [checkAuth, upload.single('attachment')], (req, res) => {
    // typecheck and validate parameters
    let { message, acknowledge = false, security_group = false, repeat_num = false, freq_num = false, ttl = '', bor = '' } = req.body

    const newBroadcast = new BroadcastService()


    if (!message) return res.send("Broadcast message missing from request.");

    newBroadcast.setMessage(message)
    newBroadcast.setTTL(ttl)
    newBroadcast.setBOR(bor)
    console.log({ message, acknowledge, security_group, repeat_num, freq_num, ttl, bor })
    // set user email without plus
    newBroadcast.setUserEmail(req.user.email)
    if (req.file === undefined)
      newBroadcast.setFile('')
    else
      newBroadcast.setFile(req.file)

    // set repeats and durations
    if (security_group) {

      if (security_group?.includes(',')) {
        security_group = security_group.split(',')
      }

      newBroadcast.setSecurityGroups(security_group)
    }
    if (acknowledge) {
      newBroadcast.setAckFlag(true)
    }

    let response = {}
    response.data = newBroadcast.broadcastMessage()

    // todo: send status on error
    res.send(response)
  });

  app.post(endpoint + "/Messages", checkAuth, (req, res) => {
    // typecheck and validate parameters
    let { message, acknowledge = false, security_group = false, repeat_num = false, freq_num = false, ttl = '', bor = '' } = req.body


    var userList = [];
    for (var i in users) {
      userList.push(users[i].name);
    }

    if (userList.length < 1) return res.send("Users missing from request.");

    // validate arguments, append message.
    if (!message) return res.send("Broadcast message missing from request.");

    newBroadcast.setTTL(ttl)
    newBroadcast.setBOR(bor)

    const newBroadcast = new BroadcastService()
    newBroadcast.setUsers(userList);

    // let broadcast = {}
    // set user email without plus
    newBroadcast.setUserEmail(req.user.email)
    // set repeats and durations

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

  app.get(endpoint + "/Status/:page/:size", checkAuth, async (req, res) => {
    // too many calls, wickrio api should support a single status call for x records including sender and message content
    const status = await getStatus(req.params.page, req.params.size, req.user.email)
    res.json(status)
  });

  const mapEntries = (messageIdEntries, type, page, size) => {
    messageIdEntries?.map(async entry => {
      console.log({ entry })
      let contentData = JSON.parse(APIService.getMessageIDEntry(entry.message_id));
      entry.message = contentData.message
      let statusdata = await APIService.getMessageStatus(entry.message_id, type, page, size)
      console.log({ statusdata })
      const parsedstatus = JSON.parse(statusdata)
      entry.summary = {}
      entry.test = "test"
      entry.summary.pending = 0
      entry.summary.sent = 0
      entry.summary.failed = 0
      entry.summary.ack = 0
      entry.summary.ignored = 0
      entry.summary.aborted = 0
      entry.summary.read = 0
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

  const getStatus = async (page, size, email) => {
    // if user hasn't sent a message in the last 'size' messages, will it show zero messages unless we search a larger index that captures the user's message?
    var tableDataRaw = APIService.getMessageIDTable(String(page), String(size), String(email));

    var messageIdEntries = JSON.parse(tableDataRaw).filter(entry => {
      return entry.sender == email
    });

    try {
      const builtStatus = await mapEntries(messageIdEntries, 'full', page, size)

      var reply = {};
      if (builtStatus.length < 1) {
        reply.data = []
        reply.error = "no broadcasts yet"
      } else {
        reply.data = builtStatus
        console.log({ builtStatus })
      }
      return reply
    } catch (e) {
      console.log(e)
      return e
    }
  }

  // need page or size? 
  app.get(endpoint + "/Status/:messageID", checkAuth, (req, res) => {
    // validate message id
    var statusData = APIService.getMessageStatus(req.params.messageID, "full", "0", "1000");
    var reply = statusData;
    return res.send(reply);
  });

  app.get(endpoint + "/Report/:messageID/:page/:size", checkAuth, (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.set('Authorization', 'Basic base64_auth_token');

    var reportEntries = [];

    var statusData = APIService.getMessageStatus(req.params.messageID, "full", req.params.page, req.params.size);
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
}


export default useRESTRoutes
