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

const InitializeSend = require('../build/commands/initialize-send')
const SendService = require('../build/services/send-service')


describe('send validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /send is not the command', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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
  */
})
