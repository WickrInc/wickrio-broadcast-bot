import State from '../state'

class Abort {
  constructor({ genericService, messageService }) {
    this.genericService = genericService
    this.messageService = messageService
    this.commandString = '/abort'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    // logger.debug(`:${this.messageService.getArguments()}:`)
    this.genericService.resetIndexes()
    const userEmail = this.messageService.userEmail
    // check argument here!
    // args = argument.split(' ');
    // if (messageService.getArgument() === '') {
    // TODO put if statement in to allow for argument to this command
    const entries = this.genericService.getMessageEntries(userEmail, true)
    const entriesString = this.genericService.getEntriesString(userEmail, true)
    let reply
    if (!entries || entries.length < 1) {
      reply = entriesString
    } else {
      reply = `${entriesString}Which message would you like to abort?`
    }
    if (entries.length > this.genericService.getEndIndex()) {
      reply += '\nOr to see more messages reply more'
    }
    return {
      reply,
      state: State.WHICH_ABORT,
    }
  }
}

module.exports = Abort
