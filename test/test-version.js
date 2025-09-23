// const expect = require('chai').expect;
const assert = require('assert')
const sinon = require('sinon')
const Version = require('../build/commands/version')

describe('start validation', function () {
  /* ================================================================================ */
  it('shouldExecute false if /start is not the command', async function () {
    const messageService = {
      command: '/cancel',
    }

    const start = new Version({
      messageService: messageService,
    })

    assert.equal(start.shouldExecute(messageService), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /start is the command', async function () {
    const messageService = {
      command: '/version',
    }

    const start = new Version({
      messageService: messageService,
    })

    assert.equal(start.shouldExecute(messageService), true)
  })

  /* ================================================================================ */
  it('execute() returns a reply', async function () {
    const messageService = {
      command: '/version',
    }

    const version = new Version({
      messageService: messageService,
    })

    const replyValue = await version.execute()

    // sinon.assert.called(bot.getVersions)
    assert.ok(replyValue.reply)
  })
})
