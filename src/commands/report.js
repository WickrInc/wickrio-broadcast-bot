import State from '../state'

class Report {
  constructor({ genericService, messageService }) {
    this.genericService = genericService
    this.messageService = messageService
    this.commandString = '/report'
  }

  shouldExecute() {
    if (this.messageService.getCommand() === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const userEmail = this.messageService.getUserEmail()
    this.genericService.resetIndexes()
    const entriesString = this.genericService.getEntriesString(userEmail)
    const entries = this.genericService.getMessageEntries(userEmail, false)
    let reply
    if (!entries || entries.length === 0) {
      reply = entriesString
    } else {
      reply = `${entriesString}Which message would you like to see the report of?`
    }
    if (entries.length > this.genericService.getEndIndex()) {
      reply += '\nOr to see more messages reply more'
    }
    return {
      reply,
      state: State.WHICH_REPORT,
    }
  }
}

export default Report
