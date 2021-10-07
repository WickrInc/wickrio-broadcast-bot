import State from '../state'

class WhichAbort {
  constructor({ genericService, messageService }) {
    this.genericService = genericService
    this.messageService = messageService
    this.state = State.WHICH_ABORT
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
    const entries = this.genericService.getMessageEntries(userEmail, true)
    const index = this.messageService.message
    if (index === 'more') {
      this.genericService.incrementIndexes()
      reply = this.genericService.getEntriesString(userEmail, true)
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
      const messageID = `${entries[parseInt(index, 10) - 1].message_id}`
      reply = this.genericService.cancelMessageID(messageID)
      state = State.NONE
    }
    return {
      reply,
      state,
    }
  }
}

export default WhichAbort
