import multer from 'multer'
import fs from 'fs'
import {
  bot,
  apiService,
  WickrUser,
  BOT_KEY,
  BOT_AUTH_TOKEN,
  WICKRIO_BOT_NAME,
  logger,
  // cronJob
} from '../helpers/constants'
import BroadcastService from '../services/broadcast-service'

// set upload destination for attachments sent to broadcast with multer
const useRESTRoutes = app => {
  const upload = multer({ dest: 'attachments/' })
  // parse application/x-www-form-urlencoded

  const base = '/WickrIO/V2/Apps/Broadcast/'
  const endpoint = base + BOT_KEY.value

  function checkCreds(authToken) {
    try {
      let valid = true
      const authStr = Buffer.from(authToken, 'base64').toString()
      // implement authToken verification in here
      if (authStr !== BOT_AUTH_TOKEN.value) valid = false
      return valid
    } catch (err) {
      logger.error(err)
    }
  }

  /*
   * Make sure the input value is convert to a string, or ''
   */
  function valToString(val) {
    if (val === undefined || val === null) return ''
    return val.toString()
  }

  const checkBasicAuth = (req, res, next) => {
    res.set('Authorization', 'Basic base64_auth_token')
    res.set('Content-Type', 'application/json')

    let authHeader = req.get('Authorization')
    let authToken
    if (authHeader) {
      if (authHeader.indexOf(' ') === -1) {
        authToken = authHeader
      } else {
        authHeader = authHeader.split(' ')
        authToken = authHeader[1]
      }
    } else {
      // expecting
      // Bearer: BOT_AUTH_TOKEN base64
      return res
        .status(401)
        .send(
          'Access denied: invalid Authorization Header format. Correct format: "Bearer JWT"'
        )
    }
    if (!checkCreds(authToken))
      return res.status(401).send('Access denied: invalid basic-auth token.')

    next()
  }

  app.post(
    endpoint + '/Broadcast',
    [checkBasicAuth, upload.single('attachment')],
    (req, res) => {
      let obj
      let userNewFile
      let fileData

      // typecheck and validate parameters
      if (req.is('multipart/form-data')) {
        const formData = req.body
        logger.debug('form data: ', formData)
        logger.debug('form data body: ', formData.body)

        fileData = req.file
        let userAttachments
        let inFile

        if (fileData === undefined) {
          logger.info('attachment is not defined!')
        } else {
          logger.debug('originalname: ', fileData.originalname)
          logger.debug('size: ', fileData.size)
          logger.debug('destination: ', fileData.destination)
          logger.debug('filename: ', fileData.filename)

          userAttachments =
            process.cwd() + '/attachments/' + WICKRIO_BOT_NAME.value
          userNewFile = userAttachments + '/' + fileData.originalname
          inFile = process.cwd() + '/attachments/' + fileData.filename

          fs.mkdirSync(userAttachments, { recursive: true })
          if (fs.existsSync(userNewFile)) fs.unlinkSync(userNewFile)
          fs.renameSync(inFile, userNewFile)
        }

        obj = JSON.parse(formData.body)
      } else {
        obj = req.body
      }
      const {
        message,
        acknowledge = false,
        users = false,
        user_meta = false,
        security_group = false,
        repeat_num = false,
        freq_num = false,
        ttl = '',
        bor = '',
      } = obj

      if (!message) {
        return res
          .status(400)
          .send('Bad request: message missing from request.')
      }

      const userList = []
      if (users) {
        for (const i in users) {
          if (user_meta) {
            userList.push(JSON.stringify(users[i]))
          } else {
            userList.push(users[i].name)
          }
        }
      }

      // look up the user for the bot. Create a user record if not found
      let user = bot.getUser(WICKRIO_BOT_NAME.value)
      if (user === undefined) {
        const wickrUser = new WickrUser(WICKRIO_BOT_NAME.value, {})
        user = bot.addUser(wickrUser)
      }

      const newBroadcast = new BroadcastService({
        messageService: { user: { ...user, users: null } },
        apiService,
      })

      newBroadcast.setMessage(message)
      newBroadcast.setTTL(valToString(ttl))
      newBroadcast.setBOR(valToString(bor))
      newBroadcast.setSentByFlag(false)
      logger.debug({
        message,
        acknowledge,
        security_group,
        repeat_num,
        freq_num,
        ttl,
        bor,
      })
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
        let securityGroupTable = []
        if (security_group?.includes(',')) {
          securityGroupTable = security_group.split(',')
        } else {
          securityGroupTable.push(security_group)
        }
        newBroadcast.setSecurityGroups(securityGroupTable)
      } else if (users) {
        newBroadcast.setUsers(userList)
        if (user_meta) {
          const flags = ['user_meta']
          newBroadcast.setFlags(flags)
        }
      }

      if (acknowledge) {
        newBroadcast.setAckFlag(true)
      }

      const response = {}
      response.data = newBroadcast.broadcastMessage()
      // todo: send status on error
      res.send(response)
    }
  )

  app.post(
    endpoint + '/Broadcast/File',
    [checkBasicAuth, upload.single('attachment')],
    (req, res) => {
      const formData = req.body
      logger.debug('form data: ', formData)
      logger.debug('form data body: ', formData.body)

      const fileData = req.file
      let userAttachments
      let userNewFile
      let inFile

      if (fileData === undefined) {
        logger.info('attachment is not defined!')
      } else {
        logger.debug('originalname: ', fileData.originalname)
        logger.debug('size: ', fileData.size)
        logger.debug('destination: ', fileData.destination)
        logger.debug('filename: ', fileData.filename)

        userAttachments =
          process.cwd() + '/attachments/' + WICKRIO_BOT_NAME.value
        userNewFile = userAttachments + '/' + fileData.originalname
        inFile = process.cwd() + '/attachments/' + fileData.filename

        fs.mkdirSync(userAttachments, { recursive: true })
        if (fs.existsSync(userNewFile)) fs.unlinkSync(userNewFile)
        fs.renameSync(inFile, userNewFile)
      }

      const obj = JSON.parse(formData.body)
      const {
        message,
        acknowledge = false,
        users,
        user_meta = false,
        security_group = false,
        repeat_num = false,
        freq_num = false,
        ttl = '',
        bor = '',
      } = obj

      if (!message) {
        return res
          .status(400)
          .send('Bad request: message missing from request.')
      }

      logger.debug('message: ', message)

      // look up the user for the bot. Create a user record if not found
      let user = bot.getUser(WICKRIO_BOT_NAME.value)
      if (user === undefined) {
        const wickrUser = new WickrUser(WICKRIO_BOT_NAME.value, {})
        user = bot.addUser(wickrUser)
      }

      const newBroadcast = new BroadcastService({
        messageService: { user: { ...user, users: null } },
        apiService,
      })

      newBroadcast.setMessage(message)
      newBroadcast.setTTL(valToString(ttl))
      newBroadcast.setBOR(valToString(bor))
      newBroadcast.setSentByFlag(false)
      logger.debug({
        message,
        acknowledge,
        security_group,
        repeat_num,
        freq_num,
        ttl,
        bor,
      })
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
        let securityGroupTable = []
        if (security_group?.includes(',')) {
          securityGroupTable = security_group.split(',')
        } else {
          securityGroupTable.push(security_group)
        }
        newBroadcast.setSecurityGroups(securityGroupTable)
      } else if (users) {
        const userList = []
        for (const i in users) {
          if (user_meta) {
            userList.push(JSON.stringify(users[i]))
          } else {
            userList.push(users[i].name)
          }
        }
        newBroadcast.setUsers(userList)
        if (user_meta) {
          const flags = ['user_meta']
          newBroadcast.setFlags(flags)
        }
      }

      if (acknowledge) {
        newBroadcast.setAckFlag(true)
      }

      const response = {}
      response.data = newBroadcast.broadcastMessage()
      // todo: send status on error
      res.send(response)
    }
  )

  app.post(endpoint + '/Messages', checkBasicAuth, (req, res) => {
    // typecheck and validate parameters
    const {
      message,
      acknowledge = false,
      users,
      user_meta = false,
      security_group = false,
      // repeat_num = false,
      // freq_num = false,
      ttl = '',
      bor = '',
    } = req.body

    const userList = []
    for (const i in users) {
      if (user_meta) {
        userList.push(JSON.stringify(users[i]))
      } else {
        userList.push(users[i].name)
      }
    }

    // validate arguments, append message.
    if (userList.length < 1) {
      return res.status(400).send('Bad request: Users missing from request.')
    }
    if (!message) {
      return res.status(400).send('Bad request: message missing from request.')
    }

    // look up the user for the bot. Create a user record if not found
    let user = bot.getUser(WICKRIO_BOT_NAME.value)
    if (user === undefined) {
      const wickrUser = new WickrUser(WICKRIO_BOT_NAME.value, {})
      user = bot.addUser(wickrUser)
    }

    const newBroadcast = new BroadcastService({
      messageService: { user: { ...user, users: null } },
      apiService,
    })

    newBroadcast.setMessage(message)
    newBroadcast.setUsers(userList)
    if (user_meta) {
      const flags = ['user_meta']
      newBroadcast.setFlags(flags)
    }
    newBroadcast.setTTL(valToString(ttl))
    newBroadcast.setBOR(valToString(bor))
    newBroadcast.setSentByFlag(false)

    // let broadcast = {}
    // set user email without plus
    newBroadcast.setUserEmail(WICKRIO_BOT_NAME.value)
    // set repeats and durations

    if (acknowledge) {
      newBroadcast.setAckFlag(true)
    }

    if (security_group) {
      let securityGroupTable = []
      if (security_group?.includes(',')) {
        securityGroupTable = security_group.split(',')
      } else {
        securityGroupTable.push(security_group)
      }
      newBroadcast.setSecurityGroups(securityGroupTable)
    }

    const response = {}
    response.data = newBroadcast.broadcastMessage()
    // todo: send status on error
    res.send(response)
  })

  app.post(endpoint + '/Abort', checkBasicAuth, (req, res) => {
    if (!req.query.messageID)
      return res
        .status(400)
        .send('Bad request: messageID missing from request.')
    const messageID = req.query.messageID

    // Make sure the MessageID entry exists
    const msgIDJSON = apiService.getMessageIDEntry(messageID)
    if (msgIDJSON === undefined) {
      return res.status(404).send('Not Found: Message ID entry does not exist.')
    }

    // Make sure the MessageID entry is for this user
    const msgIDEntry = JSON.parse(msgIDJSON)
    if (WICKRIO_BOT_NAME.value !== msgIDEntry.sender) {
      return res
        .status(401)
        .send('Unauthorized: Message is not from this user.')
    }

    const reply = {}
    reply.result = apiService.cancelMessageID(messageID)
    reply.status = apiService.getMessageStatus(messageID, 'summary', '', '')
    res.json(reply)
  })

  app.get(endpoint + '/SecGroups', checkBasicAuth, (req, res) => {
    try {
      // how does cmdGetSecurityGroups know what user to get security groups for?
      // could we get securityg groups for a targeted user?
      const response = apiService.getSecurityGroups()
      res.json(response)
    } catch (err) {
      logger.error(err)
      res.statusCode = 400
      res.type('txt').send(err.toString())
    }
  })

  // similiar to the /status command, but returns a list of the messages associated with this user
  // Will have to use the /Summary or /Details endpoints to get the summary information for a specific messageID
  app.get(endpoint + '/Messages', checkBasicAuth, async (req, res) => {
    if (!req.query.page)
      return res.status(400).send('Bad request: page missing from request.')
    if (!req.query.limit)
      return res.status(400).send('Bad request: limit missing from request.')
    const page = req.query.page
    const limit = req.query.limit
    const tableDataRaw = apiService.getMessageIDTable(
      page,
      limit,
      WICKRIO_BOT_NAME.value
    )
    const messageIdEntries = JSON.parse(tableDataRaw)
    res.json(messageIdEntries)
  })

  app.get(endpoint + '/Summary', checkBasicAuth, async (req, res) => {
    if (!req.query.messageID)
      return res
        .status(400)
        .send('Bad request: messageID missing from request.')
    const messageID = req.query.messageID

    const statusdata = await apiService.getMessageStatus(
      messageID,
      'summary',
      '',
      ''
    )
    const parsedstatus = JSON.parse(statusdata)
    res.json(parsedstatus)
  })

  app.get(endpoint + '/Status', checkBasicAuth, async (req, res) => {
    if (!req.query.page)
      return res.status(400).send('Bad request: page missing from request.')
    if (!req.query.limit)
      return res.status(400).send('Bad request: limit missing from request.')
    const page = req.query.page
    const limit = req.query.limit
    // too many calls, wickrio api should support a single status call for x records including sender and message content
    const status = await getStatus(page, limit, WICKRIO_BOT_NAME.value)
    res.json(status)
  })

  const mapEntries = (messageIdEntries, type, page, size) => {
    messageIdEntries?.map(async entry => {
      logger.debug({ entry })
      const contentData = JSON.parse(
        apiService.getMessageIDEntry(entry.message_id)
      )
      entry.message = contentData.message
      const statusdata = await apiService.getMessageStatus(
        entry.message_id,
        type,
        page,
        size
      )
      logger.debug({ statusdata })
      const parsedstatus = JSON.parse(statusdata)
      entry.summary = {}
      entry.test = 'test'
      entry.summary.pending = 0
      entry.summary.sent = 0
      entry.summary.failed = 0
      entry.summary.ack = 0
      entry.summary.ignored = 0
      entry.summary.aborted = 0
      entry.summary.read = 0
      entry.status = parsedstatus

      parsedstatus?.map(user => {
        if (user.status === 0) {
          entry.summary.pending += 1
        } else if (user.status === 1) {
          entry.summary.sent += 1
        } else if (user.status === 2) {
          entry.summary.failed += 1
        } else if (user.status === 3) {
          entry.summary.ack += 1
        }
      })
    })
    return messageIdEntries
  }

  const getStatus = async (page, size, email) => {
    // if user hasn't sent a message in the last 'size' messages, will it show zero messages unless we search a larger index that captures the user's message?
    const tableDataRaw = apiService.getMessageIDTable(
      String(page),
      String(size),
      String(email)
    )

    const messageIdEntries = JSON.parse(tableDataRaw).filter(entry => {
      return entry.sender === email
    })

    try {
      const builtStatus = await mapEntries(messageIdEntries, 'full', page, size)

      const reply = {}
      if (builtStatus.length < 1) {
        reply.data = []
        reply.error = 'no broadcasts yet'
      } else {
        reply.data = builtStatus
        logger.debug({ builtStatus })
      }
      return reply
    } catch (e) {
      logger.error(e)
      return e
    }
  }

  app.get(endpoint + '/Report', checkBasicAuth, (req, res) => {
    if (!req.query.messageID)
      return res
        .status(400)
        .send('Bad request: messageID missing from request.')
    if (!req.query.page)
      return res.status(400).send('Bad request: page missing from request.')
    if (!req.query.limit)
      return res.status(400).send('Bad request: limit missing from request.')
    const messageID = req.query.messageID
    const page = req.query.page
    const limit = req.query.limit

    // Make sure the MessageID entry exists
    const msgIDJSON = apiService.getMessageIDEntry(messageID)
    if (msgIDJSON === undefined) {
      return res.status(404).send('Not Found: Message ID entry does not exist.')
    }

    // Make sure the MessageID entry is for this user
    const msgIDEntry = JSON.parse(msgIDJSON)
    if (WICKRIO_BOT_NAME.value !== msgIDEntry.sender) {
      return res
        .status(401)
        .send('Unauthorized: Message is not from this user.')
    }

    res.set('Content-Type', 'text/plain')
    res.set('Authorization', 'Basic base64_auth_token')

    const reportEntries = []

    let statusData
    if (req.query.filter || req.query.users) {
      const filter = req.query.filter ? req.query.filter : ''
      const users = req.query.users ? req.query.users : ''
      statusData = apiService.getMessageStatusFiltered(
        messageID,
        'full',
        page,
        limit,
        filter,
        users
      )
    } else {
      statusData = apiService.getMessageStatus(messageID, 'full', page, limit)
    }
    if (statusData) {
      const messageStatus = JSON.parse(statusData)
      for (const entry of messageStatus) {
        let statusMessageString = ''
        let statusString = ''
        let sentDateString = ''
        let readDateString = ''
        let metaString = ''
        if (entry.sent_datetime !== undefined)
          sentDateString = entry.sent_datetime
        if (entry.read_datetime !== undefined)
          readDateString = entry.read_datetime
        if (entry.meta !== undefined) metaString = entry.meta
        switch (entry.status) {
          case 0:
            statusString = 'pending'
            break
          case 1:
            statusString = 'sent'
            break
          case 2:
            statusString = 'failed'
            statusMessageString = entry.status_message
            break
          case 3:
            statusString = 'acked'
            if (entry.status_message !== undefined) {
              const obj = JSON.parse(entry.status_message)
              if (obj.location !== undefined) {
                const latitude = obj.location.latitude
                const longitude = obj.location.longitude
                statusMessageString =
                  'http://www.google.com/maps/place/' +
                  latitude +
                  ',' +
                  longitude
              } else {
                statusMessageString = entry.status_message
              }
            }
            break
          case 4:
            statusString = 'ignored'
            statusMessageString = entry.status_message
            break
          case 5:
            statusString = 'aborted'
            statusMessageString = entry.status_message
            break
          case 6:
            statusString = 'read'
            statusMessageString = entry.status_message
            break
          case 7: // NOT SUPPORTED YET
            statusString = 'delivered'
            statusMessageString = entry.status_message
            break
        }
        reportEntries.push({
          user: entry.user,
          status: statusString,
          statusMessage: statusMessageString,
          sentDate: sentDateString,
          readDate: readDateString,
          meta: metaString,
        })
      }
    }
    const reply = JSON.stringify(reportEntries)
    res.set('Content-Type', 'application/json')
    return res.send(reply)
  })

  app.post(endpoint + '/EventRecvCallback', checkBasicAuth, function (
    req,
    res
  ) {
    const callbackUrl = req.query.callbackurl
    logger.debug('callbackUrl:', callbackUrl)
    try {
      const csmc = apiService.setEventCallback(callbackUrl)
      logger.debug(csmc)
      res.type('txt').send(csmc)
    } catch (err) {
      logger.error(err)
      res.statusCode = 400
      res.type('txt').send(err.toString())
    }
  })

  app.get(endpoint + '/EventRecvCallback', checkBasicAuth, function (req, res) {
    try {
      const cgmc = apiService.getEventCallback()
      res.type('txt').send(cgmc)
    } catch (err) {
      logger.error(err)
      res.statusCode = 400
      res.type('txt').send(err.toString())
    }
  })

  app.delete(endpoint + '/EventRecvCallback', checkBasicAuth, function (
    req,
    res
  ) {
    try {
      const cdmc = apiService.deleteEventCallback()
      logger.debug(cdmc)
      res.type('txt').send(cdmc)
    } catch (err) {
      logger.error(err)
      res.statusCode = 400
      res.type('txt').send(err.toString())
    }
  })
}

export default useRESTRoutes
