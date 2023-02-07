// const expect = require('chai').expect;
// const assert = require('assert')
import assert from 'assert/strict'

const sinon = require('sinon')
const Start = require('../build/commands/start')
const combinedService = require('../build/services/combined-service')

describe('start validation', function () {
  /* ================================================================================ */
  it('shouldExecute false if /start is not the command', async function () {
    const messageService = {
      commandString: '/cancel',
    }

    const combinedService = {}
    const setupService = {}

    const start = new Start({
      messageService: messageService,
      combinedService: combinedService,
      setupService: setupService,
    })

    assert.equal(start.shouldExecute(messageService), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /start is the command', async function () {
    const combinedService = {}
    const setupService = {}

    const messageService = {
      command: '/start',
    }

    const start = new Start({
      messageService: messageService,
      combinedService: combinedService,
      setupService: setupService,
    })

    assert.equal(start.shouldExecute(messageService), true)
  })

  /* ================================================================================ */
  it('execute() returns a reply', async function () {
    // const clearValuesSpy = sinon.spy(combinedService, 'clearValues')
    // const setUserEmail = sinon.spy(combinedService, 'setUserEmail')
    // const setVGroupID = sinon.spy(combinedService, 'setVGroupID')
    // const setSentByFlag = sinon.spy(combinedService, 'setSentByFlag')
    // const returnObject = {
    //   reply: 'Started',
    //   messagemeta: {},
    // }
    // const setupService = {
    //   getStartReply: function (userEmail) {
    //     return returnObject
    //   },
    // }
    // const messageService = {
    //   getUserEmail: function () {
    //     return 'user@email.com'
    //   },
    // }
    // const start = new Start({
    //   messageService: messageService,
    //   combinedService: combinedService,
    //   setupService: setupService,
    // })
    // const replyValue = start.execute()
    // sinon.assert.called(combinedService.clearValues)
    // sinon.assert.called(combinedService.setUserEmail)
    // sinon.assert.called(combinedService.setVGroupID)
    // sinon.assert.called(combinedService.setSentByFlag)
    // assert.equal(replyValue.reply, 'Started')
    // assert.equal(replyValue.messagemeta, {})
    // assert.equal(replyValue.state, State
  })
})
