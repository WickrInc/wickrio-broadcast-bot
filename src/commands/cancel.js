import State from '../state'

class Cancel {
  constructor({ broadcastService, sendService, messageService }) {
    this.broadcastService = broadcastService
    this.sendService = sendService
    this.messageService = messageService
    this.commandString = '/cancel'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    this.broadcastService.clearValues()
    this.sendService.clearValues()
    const reply =
      'Previous command canceled, send a new command or enter /help for a list of commands.'
    const obj = {
      reply,
      state: State.NONE,
    }
    return obj
  }
}

export default Cancel
