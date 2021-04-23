const assert = require('assert')
const util = require('util')
const WickrIOBotAPI = require('wickrio-bot-api')
const Status = require('../build/commands/status')

const tokens =
  '{"WICKRIO_BOT_NAME" : { "value" : "test", "encrypted" : false }, "BOT_MAPS" : { "value" : "yes", "encrypted" : false }}'
console.log('tokens: ' + util.inspect(tokens, { depth: null }))
process.env.tokens = tokens
console.log(
  'process.env.tokens: ' + util.inspect(process.env.tokens, { depth: null })
)

const { apiService } = require('../build/helpers/constants')
const GenericService = require('../build/services/generic-service')

describe('status validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /status is not the command', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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
