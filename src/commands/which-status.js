import State from '../state'

// TODO combine which report and which status
class WhichStatus {
  constructor({ genericService, statusService, messageService }) {
    this.genericService = genericService
    this.statusService = statusService
    this.messageService = messageService
    this.state = State.WHICH_STATUS
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
    const entries = this.genericService.getMessageEntries(userEmail, false)
    const index = this.messageService.message
    // const endIndex = this.genericService.getEndIndex()
    if (index === 'more') {
      this.genericService.incrementIndexes()
      reply = this.genericService.getEntriesString(userEmail)
      if (entries.length > this.genericService.getEndIndex()) {
        reply += 'Or to see more messages reply more'
      }
      state = this.state
    } else if (
      !this.messageService.isInt() ||
      index < 1 ||
      index > entries.length
    ) {
      reply = `Index: ${index} is out of range. Please enter a whole number between 1 and ${entries.length} or type /cancel to end previous flow.`
      state = this.state
    } else {
      // Subtract one to account for 0 based indexes
      const messageID = `${entries[parseInt(index, 10) - 1].message_id}`
      reply = this.statusService.getStatus(messageID, false)
      state = State.NONE
    }
    return {
      reply,
      state,
    }
  }
}

export default WhichStatus
