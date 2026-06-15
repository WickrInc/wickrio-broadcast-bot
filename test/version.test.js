import { describe, it, expect } from 'vitest'
const Version = require('../build/commands/version')

describe('version validation', () => {
  it('shouldExecute false if /version is not the command', () => {
    const messageService = { command: '/cancel' }
    const version = new Version({ messageService })
    expect(version.shouldExecute(messageService)).toBe(false)
  })

  it('shouldExecute true if /version is the command', () => {
    const messageService = { command: '/version' }
    const version = new Version({ messageService })
    expect(version.shouldExecute(messageService)).toBe(true)
  })

  it('execute() returns a reply', async () => {
    const messageService = { command: '/version' }
    const version = new Version({ messageService })
    const replyValue = await version.execute()
    expect(replyValue.reply).toBeTruthy()
  })
})
