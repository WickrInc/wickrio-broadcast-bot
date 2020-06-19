import multer from 'multer'
import jwt from "jsonwebtoken"
import fs from 'fs'
import {
  bot,
  WickrUser,
  client_auth_codes,
  logger,
  BOT_KEY,
  BOT_AUTH_TOKEN,
  WICKRIO_BOT_NAME
  // cronJob
} from '../helpers/constants';
import APIService from '../services/api-service'
import BroadcastService from '../services/broadcast-service';

// set upload destination for attachments sent to broadcast with multer 
const useRESTRoutes = (app) => {
  var upload = multer({ dest: 'attachments/' })
  // parse application/x-www-form-urlencoded

  const base = "/WickrIO/V2/Apps/Broadcast/"
  const endpoint = base + BOT_KEY.value;

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

  const checkBasicAuth = (req, res, next) => {
    res.set('Authorization', 'Basic base64_auth_token');
    res.set('Content-Type', 'application/json');

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
    if (!checkCreds(authToken))
      return res.status(401).send('Access denied: invalid basic-auth token.');

    next()
  }

  app.post(endpoint + "/Broadcast", [checkBasicAuth, upload.single('attachment')], (req, res) => {
    var obj;
    var userNewFile;
    var fileData;

    // typecheck and validate parameters
    if (req.is('multipart/form-data')) {
      const formData = req.body;
      console.log('form data: ', formData);
      console.log('form data body: ', formData.body);

      fileData = req.file;
      var userAttachments;
      var inFile;

      if (fileData === undefined) {
        console.log('attachment is not defined!')
      } else {
        console.log('originalname: ', fileData.originalname);
        console.log('size: ', fileData.size);
        console.log('destination: ', fileData.destination);
        console.log('filename: ', fileData.filename);

        userAttachments = process.cwd() + '/attachments/' + WICKRIO_BOT_NAME.value;
        userNewFile = userAttachments + '/' + fileData.originalname;
        inFile = process.cwd() + '/attachments/' + fileData.filename;

        fs.mkdirSync(userAttachments, { recursive: true });
        if (fs.existsSync(userNewFile)) fs.unlinkSync(userNewFile);
        fs.renameSync(inFile, userNewFile);
      }

      obj = JSON.parse(formData.body);
    } else {
      obj = req.body;
    }
    let { message, acknowledge = false, users = false, security_group = false, repeat_num = false, freq_num = false, ttl = '', bor = '' } = obj;

    if (!message) {
      return res.status(400).send('Bad request: message missing from request.');
    }

    var userList = [];
    if (users) {
      for (var i in users) {
        userList.push(users[i].name);
      }
    }

    // look up the user for the bot. Create a user record if not found
    let user = bot.getUser(WICKRIO_BOT_NAME.value);
    if (user === undefined) {
      let wickrUser = new WickrUser(WICKRIO_BOT_NAME.value, {});
      user = bot.addUser(wickrUser);
    }

    const newBroadcast = new BroadcastService(user)
    newBroadcast.setMessage(message)
    newBroadcast.setTTL(ttl)
    newBroadcast.setBOR(bor)
    newBroadcast.setSentByFlag(false)
    console.log({ message, acknowledge, security_group, repeat_num, freq_num, ttl, bor })
    // set user email without plus
    newBroadcast.setUserEmail(WICKRIO_BOT_NAME.value)
//    if (req.file === undefined)
//      newBroadcast.setFile('')
//    else
//      newBroadcast.setFile(req.file)
    if (userNewFile === undefined) {
      newBroadcast.setFile('')
    } else {
      newBroadcast.setFile(userNewFile)
      newBroadcast.setDisplay(fileData.originalname)
    }

    // set repeats and durations
    if (security_group) {
      var securityGroupTable = [];
      if (security_group?.includes(',')) {
        securityGroupTable = security_group.split(',')
      } else {
        securityGroupTable.push(security_group);
      }
      newBroadcast.setSecurityGroups(securityGroupTable)
    } else if (users) {
      newBroadcast.setUsers(userList);
    }

    if (acknowledge) {
      newBroadcast.setAckFlag(true)
    }

    let response = {}
    response.data = newBroadcast.broadcastMessage()
    // todo: send status on error
    res.send(response)
  });

  app.post(endpoint + "/Broadcast/File", [checkBasicAuth, upload.single('attachment')], (req, res) => {
    const formData = req.body;
    console.log('form data: ', formData);
    console.log('form data body: ', formData.body);

    const fileData = req.file;
    var userAttachments;
    var userNewFile;
    var inFile;

    if (fileData === undefined) {
      console.log('attachment is not defined!')
    } else {
      console.log('originalname: ', fileData.originalname);
      console.log('size: ', fileData.size);
      console.log('destination: ', fileData.destination);
      console.log('filename: ', fileData.filename);

      userAttachments = process.cwd() + '/attachments/' + WICKRIO_BOT_NAME.value;
      userNewFile = userAttachments + '/' + fileData.originalname;
      inFile = process.cwd() + '/attachments/' + fileData.filename;

      fs.mkdirSync(userAttachments, { recursive: true });
      if (fs.existsSync(userNewFile)) fs.unlinkSync(userNewFile);
      fs.renameSync(inFile, userNewFile);
    }

    const obj = JSON.parse(formData.body);
    let { message, acknowledge = false, security_group = false, repeat_num = false, freq_num = false, ttl = '', bor = '' } = obj;

    if (!message) {
      return res.status(400).send('Bad request: message missing from request.');
    }

    console.log('message: ', message);

    // look up the user for the bot. Create a user record if not found
    let user = bot.getUser(WICKRIO_BOT_NAME.value);
    if (user === undefined) {
      let wickrUser = new WickrUser(WICKRIO_BOT_NAME.value, {});
      user = bot.addUser(wickrUser);
    }

    const newBroadcast = new BroadcastService(user)
    newBroadcast.setMessage(message)
    newBroadcast.setTTL(ttl)
    newBroadcast.setBOR(bor)
    newBroadcast.setSentByFlag(false)
    console.log({ message, acknowledge, security_group, repeat_num, freq_num, ttl, bor })
    // set user email without plus
    newBroadcast.setUserEmail(WICKRIO_BOT_NAME.value)
    if (userNewFile === undefined) {
      newBroadcast.setFile('')
    } else {
      newBroadcast.setFile(userNewFile)
      newBroadcast.setDisplay(fileData.originalname)
    }

    // set repeats and durations
    if (security_group) {
      var securityGroupTable = [];
      if (security_group?.includes(',')) {
        securityGroupTable = security_group.split(',')
      } else {
        securityGroupTable.push(security_group);
      }
      newBroadcast.setSecurityGroups(securityGroupTable)
    }

    if (acknowledge) {
      newBroadcast.setAckFlag(true)
    }

    let response = {}
    response.data = newBroadcast.broadcastMessage()
    // todo: send status on error
    res.send(response)
  });

  app.post(endpoint + "/Messages", checkBasicAuth, (req, res) => {
    // typecheck and validate parameters
    let { message, acknowledge = false, users, security_group = false, repeat_num = false, freq_num = false, ttl = '', bor = '' } = req.body

    var userList = [];
    for (var i in users) {
      userList.push(users[i].name);
    }

    // validate arguments, append message.
    if (userList.length < 1) {
      return res.status(400).send('Bad request: Users missing from request.');
    }
    if (!message) {
      return res.status(400).send('Bad request: message missing from request.');
    }

    // look up the user for the bot. Create a user record if not found
    let user = bot.getUser(WICKRIO_BOT_NAME.value);
    if (user === undefined) {
      let wickrUser = new WickrUser(WICKRIO_BOT_NAME.value, {});
      user = bot.addUser(wickrUser);
    }

    const newBroadcast = new BroadcastService(user)
    newBroadcast.setMessage(message)
    newBroadcast.setUsers(userList);
    newBroadcast.setTTL(ttl)
    newBroadcast.setBOR(bor)
    newBroadcast.setSentByFlag(false)

    // let broadcast = {}
    // set user email without plus
    newBroadcast.setUserEmail(WICKRIO_BOT_NAME.value)
    // set repeats and durations

    if (acknowledge) {
      newBroadcast.setAckFlag(true)
    }

    if (security_group) {
      var securityGroupTable = [];
      if (security_group?.includes(',')) {
        securityGroupTable = security_group.split(',')
      } else {
        securityGroupTable.push(security_group);
      }
      newBroadcast.setSecurityGroups(securityGroupTable)
    }

    let response = {}
    response.data = newBroadcast.broadcastMessage()
    // todo: send status on error
    res.send(response)
  });

  app.post(endpoint + "/Abort", checkBasicAuth, (req, res) => {
    if (!req.query.messageID) return res.status(400).send('Bad request: messageID missing from request.');
    let messageID = req.query.messageID;

    // Make sure the MessageID entry exists
    let msgIDJSON = APIService.getMessageIDEntry(messageID);
    if (msgIDJSON === undefined) {
      return res.status(404).send('Not Found: Message ID entry does not exist.');
    }

    // Make sure the MessageID entry is for this user
    let msgIDEntry = JSON.parse(msgIDJSON);
    if (WICKRIO_BOT_NAME.value !== msgIDEntry.sender) {
      return res.status(401).send('Unauthorized: Message is not from this user.');
    }

    var reply = {};
    reply['result'] = APIService.cancelMessageID(messageID)
    reply['status'] = APIService.getMessageStatus(messageID, 'summary', '', '')
    res.json(reply)
  });

  app.get(endpoint + "/SecGroups", checkBasicAuth, (req, res) => {
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

  // similiar to the /status command, but returns a list of the messages associated with this user
  // Will have to use the /Summary or /Details endpoints to get the summary information for a specific messageID
  app.get(endpoint + "/Messages", checkBasicAuth, async (req, res) => {
    if (!req.query.page) return res.status(400).send('Bad request: page missing from request.');
    if (!req.query.limit) return res.status(400).send('Bad request: limit missing from request.');
    let page = req.query.page;
    let limit = req.query.limit;
    const tableDataRaw = APIService.getMessageIDTable(page, limit, WICKRIO_BOT_NAME.value);
    var messageIdEntries = JSON.parse(tableDataRaw)
    res.json(messageIdEntries)
  });

  app.get(endpoint + "/Summary", checkBasicAuth, async (req, res) => {
    if (!req.query.messageID) return res.status(400).send('Bad request: messageID missing from request.');
    let messageID = req.query.messageID;

    let statusdata = await APIService.getMessageStatus(messageID, 'summary', '', '')
    const parsedstatus = JSON.parse(statusdata)
    res.json(parsedstatus)
  });

  app.get(endpoint + "/Status", checkBasicAuth, async (req, res) => {
    if (!req.query.page) return res.status(400).send('Bad request: page missing from request.');
    if (!req.query.limit) return res.status(400).send('Bad request: limit missing from request.');
    let page = req.query.page;
    let limit = req.query.limit;
    // too many calls, wickrio api should support a single status call for x records including sender and message content
    const status = await getStatus(page, limit, WICKRIO_BOT_NAME.value)
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

  app.get(endpoint + "/Report", checkBasicAuth, (req, res) => {
    if (!req.query.messageID) return res.status(400).send('Bad request: messageID missing from request.');
    if (!req.query.page) return res.status(400).send('Bad request: page missing from request.');
    if (!req.query.limit) return res.status(400).send('Bad request: limit missing from request.');
    let messageID = req.query.messageID;
    let page = req.query.page;
    let limit = req.query.limit;

    // Make sure the MessageID entry exists
    let msgIDJSON = APIService.getMessageIDEntry(messageID);
    if (msgIDJSON === undefined) {
      return res.status(404).send('Not Found: Message ID entry does not exist.');
    }

    // Make sure the MessageID entry is for this user
    let msgIDEntry = JSON.parse(msgIDJSON);
    if (WICKRIO_BOT_NAME.value !== msgIDEntry.sender) {
      return res.status(401).send('Unauthorized: Message is not from this user.');
    }

    res.set('Content-Type', 'text/plain');
    res.set('Authorization', 'Basic base64_auth_token');

    var reportEntries = [];

    var statusData;
    if (req.query.filter || req.query.users) {
      const filter = (req.query.filter) ? req.query.filter : "";
      const users = (req.query.users) ? req.query.users : "";
      statusData = APIService.getMessageStatusFiltered(messageID, "full", page, limit, filter, users);
    } else {
      statusData = APIService.getMessageStatus(messageID, "full", page, limit);
    }
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
