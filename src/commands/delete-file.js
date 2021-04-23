import State from '../state'

// This class is used to select which file the user wants to delete.

class DeleteFile {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.commandString = '/delete'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    let reply = 'Here is a list of the files that you can delete:\n'
    let state = State.NONE
    const userEmail = this.messageService.userEmail
    // TODO add a more function to this
    const fileArr = this.sendService.getFiles(userEmail)
    if (!fileArr || fileArr.length === 0) {
      reply = 'There are no files to delete.'
    } else {
      const length = Math.min(fileArr.length, 10)
      for (let index = 0; index < length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`
      }
      state = State.DELETE_FILE
    }
    return {
      reply,
      state,
    }
  }
}

module.exports = DeleteFile
