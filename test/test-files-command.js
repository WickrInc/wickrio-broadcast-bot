// const expect = require('chai').expect;
// const sinon = require('sinon');

const assert = require('assert')
const util = require('util')
const fs = require('fs')
const path = require('path')
const WickrIOBotAPI = require('wickrio-bot-api')
const tokens =
  '{"WICKRIO_BOT_NAME" : { "value" : "test", "encrypted" : false }}'
console.log('tokens: ' + util.inspect(tokens, { depth: null }))
process.env.tokens = tokens
console.log(
  'process.env.tokens: ' + util.inspect(process.env.tokens, { depth: null })
)
const FilesCommand = require('../build/commands/files-command')
const SendService = require('../build/services/send-service')
// const { apiService } = require('../src/helpers/constants')

describe('files command validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /files is not the command', async () => {
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

    const sendSrv = new SendService({ messageService: msgSvc })

    const filesCommand = new FilesCommand({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(filesCommand.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /files is the command', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const filesCommand = new FilesCommand({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(filesCommand.shouldExecute(), true)
  })

  /* ================================================================================ */
  it('execute() returns correct reply when file array is empty', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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

    console.log('cwd = ', process.cwd())
    const replyvalue = filesCommand.execute()
    const expectedReply =
      "There aren't any files available for sending, please upload a file of usernames or hashes first."
    assert.equal(replyvalue.reply, expectedReply)

    fs.rmdirSync(testFileDirectory)
  })

  /* ================================================================================ */
  it('execute() returns correct reply when file array has at least one file', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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

    console.log('cwd = ', process.cwd())
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
