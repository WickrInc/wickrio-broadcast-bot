import State from '../state'
// import { logger } from '../helpers/constants'

class InitializeSend {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.commandString = '/send'
  }

  shouldExecute() {
    if (this.messageService.getCommand() === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const {
      argument,
      message,
      userEmail,
      vGroupID,
    } = this.messageService.getMessageData()
    console.log({
      argument,
      message,
      userEmail,
      vGroupID,
    })

    this.sendService.setMessage(argument)
    this.sendService.setUserEmail(userEmail)
    this.sendService.setVGroupID(vGroupID)
    this.sendService.setTTL('')
    this.sendService.setBOR('')
    // this.broadcastService.setSentByFlag(true);
    const fileArr = this.sendService.getFiles(userEmail)
    // TODO add more command to getting files
    let reply
    let state = State.NONE
    this.messageService.setUserCurrentState({ currentState: State.NONE }) // change to broacastservice?

    if (!argument) {
      reply = 'Must have a message or file to send, Usage: /send <message>'
    } else if (!fileArr || fileArr.length === 0) {
      reply =
        "There aren't any files available for sending, please upload a file of usernames or hashes first."
    } else {
      // TODO get rid of newline on last line
      // TODO add more function to listing files as well
      reply = 'To which list would you like to send your message:\n'
      for (let index = 0; index < fileArr.length; index += 1) {
        reply += `(${index + 1}) ${fileArr[index]}\n`
      }
      state = State.CHOOSE_FILE
      this.messageService.setUserCurrentState({
        currentState: State.CHOOSE_FILE,
      }) // change to broacastservice?
    }
    return {
      reply,
      state,
    }
  }
}

export default InitializeSend
