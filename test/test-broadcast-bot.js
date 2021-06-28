// const expect = require('chai').expect;
const sinon = require('sinon');
const assert = require('assert')
const util = require('util')
const path = require('path')
const WickrIOBotAPI = require('wickrio-bot-api')
const fs = require('fs')
const processesJsonFile = path.resolve(__dirname, '../processes.json')
let processesJsonFileSave = ''
const debug=false

const tokens =
  '{"WICKRIO_BOT_NAME" : { "value" : "test", "encrypted" : false }, "BOT_MAPS" : { "value" : "yes", "encrypted" : false }}'
if (debug) console.log('tokens: ' + util.inspect(tokens, { depth: null }))
process.env.tokens = tokens
if (debug) {
  console.log(
    'process.env.tokens: ' + util.inspect(process.env.tokens, { depth: null })
  )
}



  before('map validation before function', function(done) {
    // save the contents of the processes.json file
    console.log('read the processes.json file contents')
    if (fs.existsSync(processesJsonFile)) {
      processesJsonFileSave = fs.readFileSync(processesJsonFile)
    }

    const processesJson= {
      apps: [
        {
          name: "WickrIO-Broadcast-Bot_test",
          args: [],
          script: "./build/index.js",
          env: {
            tokens: {
              ADMINISTRATORS_CHOICE: {
                value: "no",
                encrypted: false
              },
              WICKRIO_BOT_NAME: {
                value: "bcast-bot",
                encrypted: false
              },
              WEB_INTERFACE: {
                value: "no",
                encrypted: false
              },
              BOT_MAPS: {
                value: "yes",
                encrypted: false
              },
              BROADCAST_ENABLED: {
                value: "yes",
                encrypted: false
              },
              RESPONSES_ENABLED: {
                value: "yes",
                encrypted: false
              },
              LIMIT_FILE_ENTRIES: {
                value: "no",
                encrypted: false
              },
              VERIFY_USERS: {
                value: "automatic",
                encrypted: false
              }
            }
          }
        }
      ]
    }
    const processesJsonString = JSON.stringify(processesJson)
    if (debug) console.log('processesJsonString=', processesJsonString)
    
    console.log('write string to processes.json')
    fs.writeFileSync(processesJsonFile, processesJsonString)

//    await mock({
//      'processes.json' : processesJsonString,
//      'build' : mock.load(path.resolve(__dirname, '../build'), {recursive: true}),
//      'node_modules' : mock.load(path.resolve(__dirname, '../node_modules'), {recursive: true})
//    })

    console.log('map before function done')
    done()
  })

  after('map validation after function', function(done) {
    console.log('writing the dat back to the processes.json file')
    if (processesJsonFileSave.length > 0) {
      fs.writeFileSync(processesJsonFile, processesJsonFileSave)
    }
    console.log('map after function done')
    done()
  })



/* ============================== Abort Tests ===================================== */

describe('abort validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /abort is not the command', async () => {
    const Abort = require('../build/commands/abort')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const ver = new Abort({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /abort is the command', async () => {
    const Abort = require('../build/commands/abort')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/abort',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const ver = new Abort({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const Abort = require('../build/commands/abort')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/abort',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const ver = new Abort({
      genericService: genericService,
      messageService: msgSvc,
    })

    const replyvalue = ver.execute()
    assert.ok(replyvalue.reply)
  })
  */
})


/* ============================== Abort Tests ===================================== */

describe('ack validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /ack is not the command', async () => {
    const Ack = require('../build/commands/ack')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const ver = new Ack({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /ack is the command', async () => {
    const Ack = require('../build/commands/ack')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/ack',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const ver = new Ack({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const Ack = require('../build/commands/ack')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/ack',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const ver = new Ack({
      genericService: genericService,
      messageService: msgSvc,
    })

    const replyvalue = ver.execute()
    assert.ok(replyvalue.reply)
  })
  */
})


/* ============================== Broadcast Tests ================================= */

describe('broadcast validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /broadcast is not the command', async () => {
    const InitializeBroadcast = require('../build/commands/initialize-broadcast')
    const BroadcastService = require('../build/services/broadcast-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const apiService = bot.apiService()

    const bcastSvc = new BroadcastService({
      messageService: msgSvc,
      apiService: apiService,
    })

    const initbcast = new InitializeBroadcast({
      broadcastService: bcastSvc,
      messageService: msgSvc,
    })

    assert.equal(initbcast.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /broadcast is the command', async () => {
    const InitializeBroadcast = require('../build/commands/initialize-broadcast')
    const BroadcastService = require('../build/services/broadcast-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/broadcast',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const apiService = bot.apiService()

    const bcastSvc = new BroadcastService({
      messageService: msgSvc,
      apiService: apiService,
    })

    const initbcast = new InitializeBroadcast({
      broadcastService: bcastSvc,
      messageService: msgSvc,
    })

    assert.equal(initbcast.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const InitializeBroadcast = require('../build/commands/initialize-broadcast')
    const BroadcastService = require('../build/services/broadcast-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/broadcast',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    const replyvalue = ver.execute()
    assert.ok(replyvalue.reply)
  })
  */
})



/* ============================== Cancel Tests ==================================== */

describe('cancel validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /cancel is not the command', async () => {
    const Cancel = require('../build/commands/cancel')
    const BroadcastService = require('../build/services/broadcast-service')
    const SendService = require('../build/services/send-service')
    const { apiService } = require('../src/helpers/constants')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const bcastSrv = new BroadcastService({
      messageService: msgSvc,
      apiService: apiService,
    })

    const sendSrv = new SendService({ messageService: msgSvc })

    const cancel = new Cancel({
      broadcastService: bcastSrv,
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(cancel.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /cancel is the command', async () => {
    const Cancel = require('../build/commands/cancel')
    const BroadcastService = require('../build/services/broadcast-service')
    const SendService = require('../build/services/send-service')
    const { apiService } = require('../src/helpers/constants')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/cancel',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const bcastSrv = new BroadcastService({
      messageService: msgSvc,
      apiService: apiService,
    })

    const sendSrv = new SendService({ messageService: msgSvc })

    const cancel = new Cancel({
      broadcastService: bcastSrv,
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(cancel.shouldExecute(), true)
  })

  /* ================================================================================ */
  it('execute() returns a reply', async () => {
    const Cancel = require('../build/commands/cancel')
    const BroadcastService = require('../build/services/broadcast-service')
    const SendService = require('../build/services/send-service')
    const { apiService } = require('../src/helpers/constants')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/cancel',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const bcastSrv = new BroadcastService({
      messageService: msgSvc,
      apiService: apiService,
    })

    const sendSrv = new SendService({ messageService: msgSvc })

    const cancel = new Cancel({
      broadcastService: bcastSrv,
      sendService: sendSrv,
      messageService: msgSvc,
    })

    const replyvalue = cancel.execute()
    assert.ok(replyvalue.reply)
  })
})

/* ============================== Delete File Tests =============================== */

describe('delet file validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /delete is not the command', async () => {
    const DeleteFile = require('../build/commands/delete-file')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const deleteFile = new DeleteFile({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(deleteFile.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /delete is the command', async () => {
    const DeleteFile = require('../build/commands/delete-file')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/delete',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const deleteFile = new DeleteFile({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(deleteFile.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const DeleteFile = require('../build/commands/delete-file')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/delete',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const delete = new DeleteFile({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    const replyvalue = delete.execute()
    assert.ok(replyvalue.reply)
  })
  */
})


/* ============================== Files Tests ===================================== */

describe('files command validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /files is not the command', async () => {
    const FilesCommand = require('../build/commands/files-command')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const filesCommand = new FilesCommand({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(filesCommand.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /files is the command', async () => {
    const FilesCommand = require('../build/commands/files-command')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/files',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const filesCommand = new FilesCommand({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(filesCommand.shouldExecute(), true)
  })

  /* ================================================================================ */
  it('execute() returns correct reply when file array is empty', async () => {
    const FilesCommand = require('../build/commands/files-command')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/files',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const filesCommand = new FilesCommand({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    const testFileDirectory = path.join(
      process.cwd(),
      'files',
      'testuser@wickr.com'
    )
    if (!fs.existsSync(testFileDirectory)) {
      fs.mkdirSync(testFileDirectory)
    }

    if (debug) console.log('cwd = ', process.cwd())
    const replyvalue = filesCommand.execute()
    const expectedReply =
      "There aren't any files available for sending, please upload a file of usernames or hashes first."

    fs.rmdirSync(testFileDirectory)
    assert.equal(replyvalue.reply, expectedReply)
  })

  /* ================================================================================ */
  it('execute() returns correct reply when file array has at least one file', async () => {
    const FilesCommand = require('../build/commands/files-command')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/files',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const filesCommand = new FilesCommand({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    const testFileDirectory = path.join(
      process.cwd(),
      'files',
      'testuser@wickr.com'
    )
    if (!fs.existsSync(testFileDirectory)) {
      fs.mkdirSync(testFileDirectory)
    }

    const filePath = path.join(testFileDirectory, 'testFile.txt')
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'hello world')
    }

    if (debug) console.log('cwd = ', process.cwd())
    const replyvalue = filesCommand.execute()
    console.log(replyvalue)
    const expectedReply =
      'Here is a list of the files to which you can send a message:\n' +
      '(1) testFile.txt\n'

    fs.unlinkSync(filePath)
    fs.rmdirSync(testFileDirectory)

    assert.equal(replyvalue.reply, expectedReply)
  })
})



/* ============================== Help Tests ====================================== */

describe('help validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /help is not the command', async () => {
    const Help = require('../build/commands/help')
    const { apiService } = require('../build/helpers/constants')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })

    console.log('messageService=' + JSON.stringify(msgSvc))

    const help = new Help({
      apiService: apiService,
      messageService: msgSvc,
    })

    assert.equal(help.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /help is the command', async () => {
    const Help = require('../build/commands/help')
    const { apiService } = require('../build/helpers/constants')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

    const help = new Help({
      apiService: apiService,
      messageService: msgSvc,
    })

    assert.equal(help.shouldExecute(), true)
  })

  /* ================================================================================ */
  it('execute() returns a reply', async () => {
    const Help = require('../build/commands/help')
    const { apiService } = require('../build/helpers/constants')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

    const help = new Help({
      apiService: apiService,
      messageService: msgSvc,
    })

    const send = sinon.stub(apiService, 'sendRoomMessage')

    const replyvalue = help.execute()

    send.restore()

    //assert.ok(replyvalue.reply)
    sinon.assert.calledOnce(send)
  })
})


/* ============================== Report Tests ==================================== */

describe('report validation', () => {

  /* ================================================================================ */
  it('shouldExecute false if /report is not the command', async () => {
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const Report = require('../build/commands/report')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const report = new Report({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(report.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /report is the command', async () => {
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const Report = require('../build/commands/report')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/report',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const report = new Report({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(report.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const Report = require('../build/commands/report')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/report',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const report = new Report({
      genericService: genericService,
      messageService: msgSvc,
    })

    const replyvalue = report.execute()
    assert.ok(replyvalue.reply)
  })
  */
})


/* ============================== Send Tests ====================================== */

describe('send validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /send is not the command', async () => {
    const InitializeSend = require('../build/commands/initialize-send')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const apiService = bot.apiService()

    const bcastSvc = new SendService({
      messageService: msgSvc,
      apiService: apiService,
    })

    const initbcast = new InitializeSend({
      sendService: bcastSvc,
      messageService: msgSvc,
    })

    assert.equal(initbcast.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /send is the command', async () => {
    const InitializeSend = require('../build/commands/initialize-send')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/send',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const apiService = bot.apiService()

    const bcastSvc = new SendService({
      messageService: msgSvc,
      apiService: apiService,
    })

    const initbcast = new InitializeSend({
      sendService: bcastSvc,
      messageService: msgSvc,
    })

    assert.equal(initbcast.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const InitializeSend = require('../build/commands/initialize-send')
    const SendService = require('../build/services/send-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/send',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    const replyvalue = ver.execute()
    assert.ok(replyvalue.reply)
  })
  */
})


/* ============================== Status Tests ==================================== */

describe('status validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /status is not the command', async () => {
    const Status = require('../build/commands/status')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const startStatus = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const status = new Status({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(status.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /status is the command', async () => {
    const Status = require('../build/commands/status')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const startStatus = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/status',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const status = new Status({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(status.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const Status = require('../build/commands/status')
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const startStatus = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/status',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const status = new Status({
      genericService: genericService,
      messageService: msgSvc,
    })

    const replyvalue = status.execute()
    assert.ok(replyvalue.reply)
  })
  */
})


/* ============================== Map Tests ======================================= */

describe('version validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /version is not the command', async () => {
    const Version = require('../build/commands/version')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /version is the command', async () => {
    const Version = require('../build/commands/version')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), true)
  })

  /* ================================================================================ */
  it('execute() returns a reply', async () => {
    const Version = require('../build/commands/version')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    const replyvalue = ver.execute()
    assert.ok(replyvalue.reply)
  })
})


/* ============================== Version Tests =================================== */

describe('version validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /version is not the command', async () => {
    const Version = require('../build/commands/version')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /version is the command', async () => {
    const Version = require('../build/commands/version')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    assert.equal(ver.shouldExecute(), true)
  })

  /* ================================================================================ */
  it('execute() returns a reply', async () => {
    const Version = require('../build/commands/version')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/version',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

    const ver = new Version({
      messageService: msgSvc,
    })

    const replyvalue = ver.execute()
    assert.ok(replyvalue.reply)
  })
})


/* ============================== Map Tests ======================================= */

describe('map validation', () => {

  /* ================================================================================ */
  it('shouldExecute false if /map is not the command', function(done) {
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const Map = require('../build/commands/map')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/help',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const map = new Map({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(map.shouldExecute(), false)
    done()
  })

  /* ================================================================================ */
  it('shouldExecute true if /map is the command', function(done) {
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const Map = require('../build/commands/map')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/map',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const map = new Map({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(map.shouldExecute(), true)
    done()
  })

  /* ================================================================================
  it('execute() returns a reply', function(done) {
    const { apiService } = require('../build/helpers/constants')
    const GenericService = require('../build/services/generic-service')
    const Map = require('../build/commands/map')
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/map',
      sender: 'testuser@wickr.com',
      users: ['user1@wickr.com', 'user2@wickr.com'],
      vgroupid: '3423423423423423423',
    }
    const rawMessage = JSON.stringify(messageObject)
    if (debug) console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    if (debug) console.log('messageService=' + JSON.stringify(msgSvc))

    const genericService = new GenericService({
      endIndex: 10,
      messageService: msgSvc,
      apiService: apiService,
    })

    const map = new Map({
      genericService: genericService,
      messageService: msgSvc,
    })

    const replyvalue = map.execute()
    assert.ok(replyvalue.reply)
    done()
  })
  */
})
