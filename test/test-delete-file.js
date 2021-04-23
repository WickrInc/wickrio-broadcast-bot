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
const DeleteFile = require('../build/commands/delete-file')
const SendService = require('../build/services/send-service')

describe('delet file validation', () => {
  /* ================================================================================ */
  it('shouldExecute false if /delete is not the command', async () => {
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

    const sendSrv = new SendService({ messageService: msgSvc })

    const deleteFile = new DeleteFile({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(deleteFile.shouldExecute(), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /delete is the command', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

    const sendSrv = new SendService({ messageService: msgSvc })

    const deleteFile = new DeleteFile({
      sendService: sendSrv,
      messageService: msgSvc,
    })

    assert.equal(deleteFile.shouldExecute(), true)
  })

  /* ================================================================================
  it('execute() returns a reply', async () => {
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
    console.log('rawMessage=' + rawMessage)

    const msgSvc = bot.messageService({
      rawMessage,
      testOnly: true,
    })
    console.log('messageService=' + JSON.stringify(msgSvc))

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
