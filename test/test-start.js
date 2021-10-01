// const expect = require('chai').expect;
// const assert = require('assert')
import assert from 'assert/strict'

const sinon = require('sinon')
const Start = require('../build/commands/start')

describe('start validation', function () {
  /* ================================================================================ */
  it('shouldExecute false if /start is not the command', async function () {
    const messageService = {
      getCommand: sinon.fake.returns('/cancel'),
    }

    const combinedService = {}
    const setupService = {}

    const start = new Start({
      messageService: messageService,
      combinedService: combinedService,
      setupService: setupService,
    })

    assert.strictequal(start.shouldExecute(messageService), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /start is the command', async function () {
    const combinedService = {}
    const setupService = {}

    const messageService = {
      getCommand: sinon.fake.returns('/start'),
    }

    const start = new Start({
      messageService: messageService,
      combinedService: combinedService,
      setupService: setupService,
    })

    assert.strictequal(start.shouldExecute(messageService), true)
  })

  /* ================================================================================ */
  it('execute() returns a reply', async function () {
    const combinedService = {}
    const bot = {
      getVersions: sinon.fake.getVersions,
    }
    const setupService = {}
    const messageService = {}

    const start = new Start({
      messageService: messageService,
      combinedService: combinedService,
      setupService: setupService,
    })

    const replyValue = start.execute()

    sinon.assert.called(bot.getVersions)
    assert.ok(replyValue.reply)
  })
})
