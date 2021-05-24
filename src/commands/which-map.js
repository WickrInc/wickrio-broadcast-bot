import State from '../state'

// TODO combine which report and which map
class WhichMap {
  constructor({ genericService, mapService, messageService }) {
    this.genericService = genericService
    this.mapService = mapService
    this.messageService = messageService
    this.state = State.WHICH_MAP
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    let reply
    let state
    const userEmail = this.messageService.userEmail
    const currentEntries = this.genericService.getMessageEntries(userEmail)
    const index = this.messageService.message
    const endIndex = this.genericService.getEndIndex()
    if (index === 'more') {
      this.genericService.incrementIndexes()
      reply = this.genericService.getEntriesString(userEmail)
      if (currentEntries.length > this.genericService.getEndIndex()) {
        reply += 'Or to see more messages reply more'
      }
      state = this.state
    } else if (!this.messageService.isInt() || index < 1 || index > endIndex) {
      reply = `Index: ${index} is out of range. Please enter a whole number between 1 and ${endIndex} or type /cancel to end previous flow.`
      state = this.state
    } else {
      // Subtract one to account for 0 based indexes
      const messageID = `${currentEntries[parseInt(index, 10) - 1].message_id}`
      reply = this.mapService.getMap(messageID, false)
      state = State.NONE
    }
    return {
      reply,
      state,
    }
  }
}

export default WhichMap
