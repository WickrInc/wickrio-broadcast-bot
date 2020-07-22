import State from '../state'
import { logger } from '../helpers/constants'

class Map {
  constructor(genericService) {
    this.genericService = genericService
    this.commandString = '/map'
  }

  shouldExecute(messageService) {
    if (messageService.getCommand() === this.commandString) {
      return true
    }
    return false
  }

  execute(messageService) {
    const userEmail = messageService.getUserEmail()
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
