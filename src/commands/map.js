import State from '../state'

class Map {
  constructor({ genericService, messageService }) {
    this.genericService = genericService
    this.messageService = messageService
    this.commandString = '/map'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const userEmail = this.messageService.getUserEmail()
    this.genericService.resetIndexes()
    const entries = this.genericService.getMessageEntries(userEmail, false)
    const entriesString = this.genericService.getEntriesString(userEmail, false)
    let reply
    if (!entries || entries.length === 0) {
      reply = entriesString
    } else {
      reply = `${entriesString}Which message would you like to see the map of?`
    }
    if (entries.length > this.genericService.getEndIndex()) {
      reply += '\nOr to see more messages reply more'
    }
    return {
      reply,
      state: State.WHICH_MAP,
    }
  }
}

export default Map
