// const expect = require('chai').expect;
// const sinon = require('sinon');

const assert = require('assert')
const util = require('util')
const WickrIOBotAPI = require('wickrio-bot-api')
const tokens =
  '{"WICKRIO_BOT_NAME" : { "value" : "test", "encrypted" : false }, "BOT_MAPS" : { "value" : "yes", "encrypted" : false }}'
console.log('tokens: ' + util.inspect(tokens, { depth: null }))
process.env.tokens = tokens
console.log(
  'process.env.tokens: ' + util.inspect(process.env.tokens, { depth: null })
)
const Cancel = require('../build/commands/cancel')
const BroadcastService = require('../build/services/broadcast-service')
const SendService = require('../build/services/send-service')
const { apiService } = require('../src/helpers/constants')

describe('cancel validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /cancel is not the command', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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
