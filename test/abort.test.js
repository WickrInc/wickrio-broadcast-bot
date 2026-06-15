import { describe, it, expect, vi } from 'vitest'
const Abort = require('../build/commands/abort')

describe('abort validation', () => {
  it('shouldExecute false if /abort is not the command', () => {
    const messageService = { command: '/cancel' }
    const abort = new Abort({
      genericService: {},
      messageService,
    })
    expect(abort.shouldExecute(messageService)).toBe(false)
  })

  it('shouldExecute true if /abort is the command', () => {
    const messageService = { command: '/abort' }
    const abort = new Abort({
      messageService,
      combinedService: {},
      setupService: {},
    })
    expect(abort.shouldExecute(messageService)).toBe(true)
  })

  it('execute() no entries', async () => {
    const genericService = {
      getMessageEntries: vi.fn().mockResolvedValue([]),
      getEntriesString: vi.fn().mockResolvedValue(
        'There are no active messages to display'
      ),
      resetIndexes: vi.fn(),
      getEndIndex: vi.fn().mockReturnValue(0),
    }

    const messageService = {
      command: '/abort',
      userEmail: 'test@example.com',
    }

    const abort = new Abort({ genericService, messageService })
    const actualReply = await abort.execute()

    expect(actualReply.reply).toBe('There are no active messages to display')
    expect(actualReply.state).toBe(12)
  })
})
