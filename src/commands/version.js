import path from 'path'

import WickrIOBot from '../models/WickrIOBot'
const bot = WickrIOBot.getInstance()

class Version {
  constructor({ messageService }) {
    this.messageService = messageService
  }

  shouldExecute() {
    if (this.messageService.command === '/version') {
      return true
    }
    return false
  }

  async execute() {
    try {
      const packageJsonFile = path.join(process.cwd(), 'package.json')
      const reply = await bot.getVersions(packageJsonFile)

      return {
        reply,
      }
    } catch (err) {
      const reply = 'Failed to get version information!'
      return {
        reply,
      }
    }
  }
}

module.exports = Version
