import State from '../state'
import { logger } from '../helpers/constants'

// This class is used to send the user their selected file.

class SendUserFile {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.state = State.SEND_USER_FILE
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    const userEmail = this.messageService.userEmail
    logger.debug({ userEmail })
    const index = this.messageService.message
    let reply = null
    let state = State.NONE
    const fileArr = this.sendService.getFiles(userEmail)
    // const length = Math.min(fileArr.length, 5);
    if (!this.messageService.isInt() || index < 1 || index > fileArr.length) {
      reply = `Index: ${index} is out of range. Please enter an integer between 1 and ${fileArr.length} or type /cancel to end previous flow.`
      state = State.SEND_USER_FILE
    } else {
      // Subtract one to account for 0 based indexing
      const fileName = fileArr[parseInt(index, 10) - 1]
      const filePath = `${process.cwd()}/files/${userEmail}/${fileName}`
      this.sendService.retrieveFile(filePath, this.messageService.vGroupID)
    }
    return {
      reply,
      state,
    }
  }
}

export default SendUserFile
