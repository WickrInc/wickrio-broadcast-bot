const assert = require('assert')
const util = require('util')

const tokens =
  '{"WICKRIO_BOT_NAME" : { "value" : "test", "encrypted" : false }, "BOT_MAPS" : { "value" : "yes", "encrypted" : false }}'
console.log('tokens: ' + util.inspect(tokens, { depth: null }))
process.env.tokens = tokens
console.log(
  'process.env.tokens: ' + util.inspect(process.env.tokens, { depth: null })
)

const WickrIOBotAPI = require('wickrio-bot-api')
const { apiService } = require('../build/helpers/constants')
const GenericService = require('../build/services/generic-service')
const Map = require('../build/commands/map')

describe('map validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /map is not the command', async () => {
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
  })

  /* ================================================================================ */
  it('shouldExecute true if /map is the command', async () => {
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/map',
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

    const map = new Map({
      genericService: genericService,
      messageService: msgSvc,
    })

    assert.equal(map.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
    const bot = new WickrIOBotAPI.WickrIOBot()
    const status = await bot.startForTesting('clientName')

    const messageObject = {
      message_id: '1234',
      message: '/map',
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

    const map = new Map({
      genericService: genericService,
      messageService: msgSvc,
    })

    const replyvalue = map.execute()
    assert.ok(replyvalue.reply)
  })
  */
})
