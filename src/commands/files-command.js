import State from '../state'

// TODO add a delete file command??
// TODO add the ability to preview the contents of the file/ length of file??
class FileCommand {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.commandString = '/files'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    let reply = 'Here is a list of the files to which you can send a message:\n'
    let state = State.NONE
    const userEmail = this.messageService.userEmail
    // TODO add a more function to this
    const fileArr = this.sendService.getFiles(userEmail)
    if (!fileArr || fileArr.length === 0) {
      reply =
        "There aren't any files available for sending, please upload a file of usernames or hashes first."
    } else {
      // const length = Math.min(fileArr.length, 10)
      const length = fileArr.length
      for (let index = 0; index < length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`
      }
      state = State.SEND_USER_FILE
    }
    return {
      reply,
      state,
    }
  }
}

module.exports = FileCommand
