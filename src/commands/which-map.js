import logger from '../logger'
import State from '../state'

// TODO combine which report and which map
class WhichMap {
  constructor(genericService, statusService) {
    this.genericService = genericService
    this.statusService = statusService
    this.state = State.WHICH_MAP
  }

  shouldExecute(messageService) {
    if (messageService.getCurrentState() === this.state) {
      return true
    }
    return false
  }

  execute(messageService) {
    let reply
    let state
    const userEmail = messageService.getUserEmail()
    const currentEntries = this.genericService.getMessageEntries(userEmail)
    const index = messageService.getMessage()
    const endIndex = this.genericService.getEndIndex()
    if (index === 'more') {
      this.genericService.incrementIndexes()
      reply = this.genericService.getEntriesString(userEmail)
      if (currentEntries.length > this.genericService.getEndIndex()) {
        reply += 'Or to see more messages reply more'
      }
      state = this.state
    } else if (!messageService.isInt() || index < 1 || index > endIndex) {
      reply = `Index: ${index} is out of range. Please enter a whole number between 1 and ${endIndex}`
      state = this.state
    } else {
      // Subtract one to account for 0 based indexes
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`
      reply = this.statusService.getMap(messageID, false)
      state = State.NONE
    }
    return {
      reply,
      state,
    }
  }
}

export default WhichMap
