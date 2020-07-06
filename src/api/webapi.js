import express from 'express';
import jwt from "jsonwebtoken"
import multer from 'multer'
import fs from 'fs'
import {
  bot,
  client_auth_codes,
  BOT_AUTH_TOKEN,
  BOT_PORT,
  logger,
  WickrUser,
  // cronJob
} from '../helpers/constants';
import APIService from '../services/api-service'
import BroadcastService from '../services/broadcast-service';

// set upload destination for attachments sent to broadcast with multer 
const useWebAndRoutes = (app) => {

  app.use(express.static('public'))
  const endpoint = "/WickrIO/V2/Apps/Web/Broadcast"

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
  var upload = multer({ dest: 'attachments/' })

  const checkAuth = (req, res, next) => {
    // res.set('Authorization', 'Basic base64_auth_token');
    res.set('Content-Type', 'application/json');

    // Gather the jwt access token from the request header
    const authHeader = req.get('Authorization');
    const token = authHeader && authHeader.split(' ')[1]
    // const token = req.cookies.token


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
        client_auth_codes[userEmail] = random;
        // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk 
        // send token in url, used for calls to receive data, send messages
        const token = jwt.sign({
          email: userEmail,
          session: random,
          host: host,
          port: BOT_PORT.value
        }, BOT_AUTH_TOKEN.value, { expiresIn: '1800s' });


        // send token in url, used for authorization to use routes
        // what will the deploy env be
        let reply = {}
        reply.token = token
        // res.cookie('token', token, { httpOnly: true });
        return res.send(reply);
      }
    } catch (err) {
      console.log(err);
      res.statusCode = 400;
      res.send(err.toString());
    }
  });

  app.get(endpoint + "/Authorize", checkAuth, (req, res) => {
    try {
      let reply = { user: req.user }
      res.json(reply)
    } catch (err) {
      console.log(err);
      res.statusCode = 400;
      res.send(err.toString());
    }
  });

  app.post(endpoint + "/Message", [checkAuth, upload.single('attachment')], (req, res) => {
    // typecheck and validate parameters
    let { message, acknowledge = false, security_group = false, repeat_num = false, freq_num = false, ttl = '', bor = '', sent_by } = req.body

    let user = bot.getUser(req.user.email); // Look up user by their wickr email
    if (user === undefined) { // Check if a user exists in the database
      // let wickrUser = new WickrUser(req.user.email);
      // console.log({ newWickrUser: wickrUser })
      user = {
        userEmail: req.user.email,
        message: '',
        vGroupID: '',
        personalVGroupID: '',
        command: '',
        argument: '',
        currentState: undefined,
        fileServiceFile: '',
        fileServiceFilename: '',
        startIndex: 0,
        endIndex: 10,
        defaultEndIndex: 10
      }

      user.userEmail = bot.addUser(req.user.email); // Add a new user to the database
      console.log({ newUser: user })
    } else {
      console.log({ oldwickruser: user })
    }

    const newBroadcast = new BroadcastService(user)

    if (!message) return res.send("Broadcast message missing from request.");
    newBroadcast.setWebApp()
    newBroadcast.setMessage(message)
    newBroadcast.setTTL(ttl)
    newBroadcast.setBOR(bor)
    // console.log({ message, acknowledge, security_group, repeat_num, freq_num, ttl, bor })
    // set user email without plus
    newBroadcast.setUserEmail(req.user.email)
    newBroadcast.setUsers([])
    newBroadcast.setSentByFlag(true)
    // console.log(req.file)
    const fileData = req.file;
    var userAttachments;
    var userNewFile;
    var inFile;

    if (fileData === undefined) {
      console.log('attachment is not defined!')
    } else {
      userAttachments = process.cwd() + '/attachments/' + req.user.email;
      userNewFile = userAttachments + '/' + fileData.originalname;
      inFile = process.cwd() + '/attachments/' + fileData.filename;

      fs.mkdirSync(userAttachments, { recursive: true });
      if (fs.existsSync(userNewFile)) fs.unlinkSync(userNewFile);
      fs.renameSync(inFile, userNewFile);
    }
    if (userNewFile === undefined) {
      newBroadcast.setFile('')
    } else {
      newBroadcast.setFile(userNewFile)
      newBroadcast.setDisplay(fileData.originalname)
    }

    // set repeats and durations
    if (security_group) {

      if (security_group?.includes(',')) {
        security_group = security_group.split(',')
      }

      newBroadcast.setSecurityGroups([security_group])
    }
    if (acknowledge !== 'false' && acknowledge !== false) {
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

    // let user = bot.getUser(userEmail); // Look up user by their wickr email
    // if (user === undefined) { // Check if a user exists in the database
    //   let wickrUser = new WickrUser(userEmail);
    //   user = bot.addUser(wickrUser); // Add a new user to the database
    // }
    const newBroadcast = new BroadcastService()
    newBroadcast.setUsers(userList);

    // let broadcast = {}
    // set user email without plus
    newBroadcast.setUserEmail(req.user.email)
    // set repeats and durations
    // console.log(req.file)
    // if (!req.file) {
    //   newBroadcast.setFile('')
    // } else {
    //   let userAttachments = process.cwd() + '/attachments/' + req.user.email;
    //   let userNewFile = userAttachments + '/' + fileData.originalname;
    //   newBroadcast.setFile(userNewFile)
    //   newBroadcast.setDisplay(fileData.originalname)
    // }


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

  const buildEntry = async (entry, page, size) => {
    // console.log({ entry })
    let contentData = JSON.parse(APIService.getMessageIDEntry(entry.message_id));
    entry.message = contentData.message
    try {

      let statusdata = await APIService.getMessageStatus(entry.message_id, 'full', page, size)

      if (statusdata) {

        let statusJson = JSON.parse(statusdata)
        let date = new Date(statusJson.sent_datetime).toLocaleString('en-US')

        statusJson.sent_time = new Date(statusJson.sent_datetime).toLocaleTimeString('en-US')
        statusJson.sent_date = new Date(statusJson.sent_datetime).toLocaleDateString('en-US')
        statusJson.read_time = new Date(statusJson.sent_datetime).toLocaleTimeString('en-US')
        statusJson.read_date = new Date(statusJson.read_datetime).toLocaleDateString('en-US')

        let statusSummary = JSON.parse(APIService.getMessageStatus(String(entry.message_id), 'summary', '', ''))

        entry.summary = statusSummary
        entry.status = statusJson
      }

    } catch (e) {
      console.log({ err: e })
      entry.status = 'error'
      // return false
      // entry.err = e
    }

    return entry
  }

  const getStatus = async (page, size, email) => {
    // if user hasn't sent a message in the last 'size' messages, will it show zero messages unless we search a larger index that captures the user's message?
    let tableDataRaw = APIService.getMessageIDTable(String(page), String(size), String(email)); // unordered .list
    // console.log({ tableDataRaw: JSON.parse(tableDataRaw) })
    // don't need this with the email  in getMessageIDTable
    // var messageIdEntries = JSON.parse(tableDataRaw).filter(entry => {
    //   return entry.sender == email
    // });
    let broadcastTable = JSON.parse(tableDataRaw)
    let reply = {}

    reply.max_entries = broadcastTable.max_entries
    reply.source = broadcastTable.source

    if (broadcastTable.max_entries === 0) {
      reply.list = []
      reply.error = "no broadcasts yet"
    } else {
      broadcastTable.list?.map(async entry => {
        try {
          entry = await buildEntry(entry, page, size)
        } catch (e) {
          console.log(e)
          return e
        }
      })
      reply.list = broadcastTable.list
    }
    return reply

  }

  app.get(endpoint + "/Status/:page/:size", checkAuth, async (req, res) => {
    // too many calls, wickrio api should support a single status call for x records including sender and message content
    // console.log({ email: req.user.email })
    const status = await getStatus(req.params.page, req.params.size, req.user.email)

    res.json(status)
  });

  app.get(endpoint + "/Report/:messageID/:page/:size", checkAuth, (req, res) => {
    res.set('Content-Type', 'application/json');
    res.set('Authorization', 'Basic base64_auth_token');

    if (!req.params.messageID) { res.send("need a message id") }

    const broadcast = JSON.parse(APIService.getMessageIDEntry(req.params.messageID))
    const parsedBroadcastStatus = JSON.parse(APIService.getMessageStatus(req.params.messageID, "full", req.params.page, req.params.size));
    const statusData = JSON.parse(APIService.getMessageStatus(String(req.params.messageID), 'summary', '', ''))

    let broadcastReport = {
      ...broadcast,
      report: parsedBroadcastStatus,
      summary: statusData
    }
    // user.status = parsedBroadcastStatus
    parsedBroadcastStatus?.map(user => {
      console.log({ user })
      if (user.sent_datetime) {
        user.sent_time = new Date(user.sent_datetime).toLocaleTimeString('en-US')
        user.sent_date = new Date(user.sent_datetime).toLocaleDateString().replace(/\//g, '-');
      }
      if (user.read_datetime) {
        user.read_time = new Date(user.read_datetime).toLocaleTimeString('en-US')
        user.read_date = new Date(user.read_datetime).toLocaleDateString().replace(/\//g, '-');
      }
      if (user.status == 0) { user.status = "pending" }
      else if (user.status == 1) { user.status = "sent" }
      else if (user.status == 2) { user.status = "failed" }
      else if (user.status == 3) {
        user.status = "acknowledged"
        if (user.status_message !== undefined) {
          var obj = JSON.parse(user.status_message);
          if (obj['location'] !== undefined) {
            var latitude = obj['location'].latitude;
            var longitude = obj['location'].longitude;
            user.status_message = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
          }
        }
      }
      else if (user.status == 4) { user.status = "ignored" }
      else if (user.status == 5) { user.status = "aborted" }
      else if (user.status == 6) { user.status = "read" }
      else if (user.status == 7) { user.status = "delivered" }
    })

    return res.json(broadcastReport);
  });

}


export default useWebAndRoutes
