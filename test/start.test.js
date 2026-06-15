import { describe, it, expect } from 'vitest'
const Start = require('../build/commands/start')

describe('start validation', () => {
  it('shouldExecute false if /start is not the command', () => {
    const messageService = { commandString: '/cancel' }
    const start = new Start({
      messageService,
      combinedService: {},
      setupService: {},
    })
    expect(start.shouldExecute(messageService)).toBe(false)
  })

  it('shouldExecute true if /start is the command', () => {
    const messageService = { command: '/start' }
    const start = new Start({
      messageService,
      combinedService: {},
      setupService: {},
    })
    expect(start.shouldExecute(messageService)).toBe(true)
  })

  it('execute() returns a reply', async () => {
    // TODO: implement with vitest mocking (vi.fn())
  })
})
