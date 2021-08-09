import State from '../state'
import ButtonHelper from '../helpers/button-helper'

class ChooseFile {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.state = State.CHOOSE_FILE
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  // TODO add more function here as well
  execute() {
    const {
      // argument,
      message,
      userEmail,
      // vGroupID,
    } = this.messageService

    let reply = null
    let messagemeta = {}
    let state = State.NONE

    const fileArr = this.sendService.getFiles(userEmail)
    // const length = Math.min(fileArr.length, 5);
    if (
      !this.messageService.isInt() ||
      message < 1 ||
      message > fileArr.length
    ) {
      reply = `Index: ${message} is out of range. Please enter an integer between 1 and ${fileArr.length} or type /cancel to end previous flow.`
      state = State.CHOOSE_FILE
    } else {
      // Subtract one to account for 0 based indexing
      const fileName = fileArr[parseInt(message, 10) - 1]
      this.sendService.setSendFile(fileName)
      if (
        (this.sendService.getMessage() !== undefined &&
          this.sendService.getMessage() !== '') ||
        (this.sendService.getFile() !== undefined &&
          this.sendService.getFile() !== '')
      ) {
        state = State.ASK_FOR_ACK
        reply = 'Would you like to ask the recipients for an acknowledgement?'
        messagemeta = ButtonHelper.makeYesNoButton()
      } else {
        state = State.CREATE_MESSAGE
        reply =
          'Great! Now type a message or upload the file (by clicking on the "+" sign) that you want to broadcast.'
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = ChooseFile
