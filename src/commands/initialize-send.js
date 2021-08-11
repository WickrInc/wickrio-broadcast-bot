import State from '../state'

class InitializeSend {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.commandString = '/send'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const { message, userEmail, vGroupID } = this.messageService

    let messagemeta = {}
    let message2send
    if (message) {
      const parsedData = message.match(/(\/[a-zA-Z]+)([\s\S]*)$/)

      if (parsedData !== null) {
        if (parsedData[2] !== '') {
          message2send = parsedData[2]
          message2send = message2send.trim()
        }
      }
    }

    this.sendService.setMessage(message2send)
    this.sendService.setUserEmail(userEmail)
    this.sendService.setVGroupID(vGroupID)
    // TODO add more command to getting files
    let reply
    let state = State.NONE
    if (!message2send) {
      reply = 'Must have a message or file to send, Usage: /send <message>'
    } else {
      const sendObj = this.sendService.getFilesForSending(
        this.messageService.getUserEmail()
      )
      state = State.CHOOSE_FILE
      reply = sendObj.reply
      messagemeta = sendObj.messagemeta
    }

    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = InitializeSend
