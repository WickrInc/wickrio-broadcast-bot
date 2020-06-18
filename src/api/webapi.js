import express from 'express';
import jwt from "jsonwebtoken"
import multer from 'multer'
import fs from 'fs'
import {
  bot,
  client_auth_codes,
  BOT_AUTH_TOKEN,
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
        client_auth_codes[wickrUser] = random;
        // bot rest requests need basic base64 auth header - broadcast web needs the token from this bot. token is provided through URL - security risk 

        var token = jwt.sign({
          'email': wickrUser,
          'session': random,
        }, BOT_AUTH_TOKEN.value, { expiresIn: '1800s' });

        // send token in url, used for authorization to use routes
        // what will the deploy env be
        let reply = {}
        // reply.token = token  
        res.cookie('token', token, { httpOnly: true });
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
      console.log('originalname: ', fileData.originalname);
      console.log('size: ', fileData.size);
      console.log('destination: ', fileData.destination);
      console.log('filename: ', fileData.filename);

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

    // console.log({ file: req.file })
    // if (req.file === undefined) {
    //   newBroadcast.setFile('')
    // } else {
    //   newBroadcast.setFile(req.file.filename)
    //   newBroadcast.setDisplay(req.file.originalname)
    // }
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

  const mapEntries = (messageIdEntries, type, page, size) => {
    messageIdEntries?.map(async entry => {
      // console.log({ entry })
      let contentData = JSON.parse(APIService.getMessageIDEntry(entry.message_id));
      entry.message = contentData.message
      entry.summary = {}
      entry.test = "test"
      entry.summary.pending = 0
      entry.summary.sent = 0
      entry.summary.failed = 0
      entry.summary.ack = 0
      entry.summary.ignored = 0
      entry.summary.aborted = 0
      entry.summary.read = 0
      try {

        let statusdata = await APIService.getMessageStatus(entry.message_id, type, page, size)
        const parsedstatus = JSON.parse(statusdata)

        // console.log({ statusdata })
        entry.status = parsedstatus

        parsedstatus?.map(user => {
          if (user.status == 0) { entry.summary.pending += 1 }
          else if (user.status == 1) { entry.summary.sent += 1 }
          else if (user.status == 2) { entry.summary.failed += 1 }
          else if (user.status == 3) { entry.summary.ack += 1 }
        })
      } catch (e) {
        console.log({ err: e })
        entry.status = e
        entry.err = e
      }

    })
    return messageIdEntries
  }

  const getStatus = async (page, size, email) => {
    // if user hasn't sent a message in the last 'size' messages, will it show zero messages unless we search a larger index that captures the user's message?
    var tableDataRaw = APIService.getMessageIDTable(String(page), String(size), String(email)); // unordered .list
    // console.log({ tableDataRaw: JSON.parse(tableDataRaw) })
    // don't need this with the email  in getMessageIDTable
    // var messageIdEntries = JSON.parse(tableDataRaw).filter(entry => {
    //   return entry.sender == email
    // });
    let reply = {}
    let broadcastTable = JSON.parse(tableDataRaw)
    console.log({ list: broadcastTable.list }) //unordered 
    if (broadcastTable.max_entries === 0) {
      reply.list = []
      reply.max_entries = broadcastTable.max_entries
      reply.source = broadcastTable.source
      reply.error = "no broadcasts yet"
    } else {
      try {
        const builtStatus = await mapEntries(broadcastTable.list, 'full', page, size)
        reply.list = builtStatus
      } catch (e) {
        console.log(e)
        return e
      }
      reply.max_entries = broadcastTable.max_entries
      reply.source = broadcastTable.source
    }
    return reply

  }

  app.get(endpoint + "/Status/:page/:size", checkAuth, async (req, res) => {
    // too many calls, wickrio api should support a single status call for x records including sender and message content
    // console.log({ email: req.user.email })
    const status = await getStatus(req.params.page, req.params.size, req.user.email)
    res.json(status)
  });

  // need page or size? 
  app.get(endpoint + "/Status/:messageID", checkAuth, (req, res) => {
    // validate message id
    var statusData = APIService.getMessageStatus(String(req.params.messageID), 'summary', '0', '25');
    var reply = statusData;
    return res.send(reply);
  });

  app.get(endpoint + "/Report/:messageID/:page/:size", checkAuth, (req, res) => {
    res.set('Content-Type', 'application/json');
    res.set('Authorization', 'Basic base64_auth_token');


    const broadcast = JSON.parse(APIService.getMessageIDEntry(req.params.messageID))
    const parsedBroadcastStatus = JSON.parse(APIService.getMessageStatus(req.params.messageID, "full", req.params.page, req.params.size));

    let broadcastReport = {
      ...broadcast,
      report: parsedBroadcastStatus,
      summary: {}
    }
    let { summary } = broadcastReport


    summary.pending = 0
    summary.sent = 0
    summary.failed = 0
    summary.ack = 0
    summary.ignored = 0
    summary.aborted = 0
    summary.read = 0
    // user.status = parsedBroadcastStatus
    parsedBroadcastStatus?.map(user => {
      if (user.status == 0) {
        summary.pending += 1
      }
      else if (user.status == 1) {
        summary.sent += 1
      }
      else if (user.status == 2) {
        summary.failed += 1
      }
      else if (user.status == 3) {
        if (user.status_message !== undefined) {
          var obj = JSON.parse(user.status_message);
          if (obj['location'] !== undefined) {
            var latitude = obj['location'].latitude;
            var longitude = obj['location'].longitude;
            user.status_message = 'http://www.google.com/maps/place/' + latitude + ',' + longitude;
          }
        }
        summary.ack += 1
      }
      else if (user.status == 4) {
        summary.ignored += 1
      }
      else if (user.status == 5) {
        summary.aborted += 1
      }
      else if (user.status == 6) {
        summary.read += 1
      }
      else if (user.status == 7) {
        summary.read += 1
      }
    })

    return res.json(broadcastReport);
  });

}


export default useWebAndRoutes
