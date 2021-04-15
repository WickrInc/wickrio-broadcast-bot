// const expect = require('chai').expect;
// const sinon = require('sinon');

const assert = require('assert')
const util = require('util')
const WickrIOBotAPI = require('wickrio-bot-api')
const tokens =
  '{"WICKRIO_BOT_NAME" : { "value" : "test", "encrypted" : false }}'
console.log('tokens: ' + util.inspect(tokens, { depth: null }))
process.env.tokens = tokens
console.log(
  'process.env.tokens: ' + util.inspect(process.env.tokens, { depth: null })
)
const Help = require('../build/commands/help')
const { apiService } = require('../build/helpers/constants')

describe('help validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /help is not the command', async () => {
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

    const replyvalue = help.execute()
    assert.ok(replyvalue.reply)
  })
})
