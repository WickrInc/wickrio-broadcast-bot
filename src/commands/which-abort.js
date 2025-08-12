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

  async execute() {
    let reply
    let state
    const userEmail = this.messageService.userEmail
    const entries = await this.genericService.getMessageEntries(userEmail, true)
    const index = this.messageService.message
    if (index === 'more') {
      this.genericService.incrementIndexes()
      reply = await this.genericService.getEntriesString(userEmail, true)
      if (entries.length > this.genericService.getEndIndex()) {
        reply += '\nOr to see more messages reply more'
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
      const entryIndex = parseInt(index, 10) - 1
      const selectedEntry = entries[entryIndex]
      if (!selectedEntry || !selectedEntry.message_id) {
        reply = 'Error: Selected message is no longer available. Please try /abort again.'
        state = State.NONE
      } else {
        const messageID = selectedEntry.message_id
        reply = await this.genericService.cancelMessageID(messageID)
        state = State.NONE
      }
    }
    return {
      reply,
      state,
    }
  }
}

export default WhichAbort
