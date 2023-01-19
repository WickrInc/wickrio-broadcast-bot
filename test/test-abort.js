import assert from 'assert'

const sinon = require('sinon')
const Abort = require('../build/commands/abort')

describe('abort validation', function () {
  /* ================================================================================ */
  it('shouldExecute false if /abort is not the command', async function () {
    const genericService = {}
    const messageService = {
      // command: sinon.fake.returns('/cancel'),
      command: '/cancel',
    }

    const abort = new Abort({
      genericService,
      messageService,
    })

    assert.equal(abort.shouldExecute(messageService), false)
  })

  /* ================================================================================ */
  it('shouldExecute true if /abort is the command', async function () {
    const combinedService = {}
    const setupService = {}

    const messageService = {
      // getCommand: sinon.fake.returns('/abort'),
      command: '/abort',
    }

    const abort = new Abort({
      messageService: messageService,
      combinedService: combinedService,
      setupService: setupService,
    })

    assert.equal(abort.shouldExecute(messageService), true)
  })

  /* ================================================================================ */
  it('execute() no entries', async function () {
    const entries = []
    const genericService = {
      getMessageEntries: sinon.fake.returns(entries),
      getEntriesString: sinon.fake.returns(
        'There are no active messages to display'
      ),
      resetIndexes: sinon.spy(),
      getEndIndex: sinon.fake.returns(0),
    }

    const messageService = {
      command: '/abort',
    }

    const abort = new Abort({
      genericService,
      messageService,
    })

    const expectedReply = {
      messagemeta: {},
      reply: 'There are no active messages to display',
      state: 12,
    }
    const actualReply = abort.execute()

    assert.equal(actualReply.reply, expectedReply.reply)
    // assert.equal(actualReply.messagemeta, expectedReply.messagemeta)
    assert.equal(actualReply.state, expectedReply.state)
    // assert.equal(abort.execute(), expectedReply)
  })

  /* ================================================================================ */
  // it('execute() returns a reply', async function () {
  //   const entry1 = { message_id: '1234' }
  //   const entry2 = { message_id: '002' }
  //   const entries = [entry1, entry2]
  //   const genericService = {
  //     getMessageEntries: sinon.fake.returns(entries),
  //     getEntriesString: sinon.fake.returns(
  //       'There are no active messages to display'
  //     ),
  //     resetIndexes: sinon.spy(),
  //     getEndIndex: sinon.fake.returns(0),
  //   }
  //   const messageService = {
  //     command: '/abort',
  //   }

  //   const abort = new Abort({
  //     genericService,
  //     messageService,
  //   })

  //   const entry1 = { message_id: '1234' }
  //   const entry2 = { message_id: '002' }
  //   const msgEntries = sinon
  //     .stub(genericService, 'getMessageEntries')
  //     .returns([entry1, entry2])
  //   const getMsgEntry = sinon
  //     .stub(genericService, 'getMessageEntry')
  //     .returns('{ "message": "This is a message" }')

  //   const replyvalue = abort.execute()

  //   msgEntries.restore()
  //   getMsgEntry.restore()

  //   assert.ok(replyvalue.reply)
  // })
})
