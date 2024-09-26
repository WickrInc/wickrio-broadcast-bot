import State from '../state'
import ButtonHelper from '../helpers/button-helper'
import FileHandler from '../helpers/file-handler'

const path = require('path')

class ChooseFile {
  constructor({ sendService, fileService, messageService }) {
    this.sendService = sendService
    this.fileService = fileService
    this.messageService = messageService
    this.state = State.CHOOSE_FILE
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  // TODO add more function here as well
  async execute() {
    const {
      // argument,
      message,
      userEmail,
      file,
      // vGroupID,
    } = this.messageService

    let reply = null
    let messagemeta = {}
    let state = State.NONE

    const fileArr = this.sendService.getFiles(userEmail)
    // const length = Math.min(fileArr.length, 5);
    if ((fileArr === undefined || fileArr.length === 0) && !file) {
      reply =
        'Broadcast to multiple users by uploading a .txt file with the list of usernames in line-separated format, only one username per line'
      state = this.state
    } else if (file) {
      const filePath = this.messageService.getFilePath()
      const filename = this.messageService.getFilename()
      const userEmail = this.messageService.getUserEmail()
      this.fileService.setFilePath(filePath)
      this.fileService.setFilename(filename)
      const fileAppend = '.user'
      if (path.extname(filePath) === '.txt') {
        const checkFileObject = FileHandler.checkFileUpload(
          this.fileService,
          filename,
          filePath,
          fileArr,
          fileAppend,
          userEmail
        )
        reply = checkFileObject.reply
        state = checkFileObject.state
        messagemeta = checkFileObject.messagemeta
        if (checkFileObject.retVal) {
          this.sendService.setSendFile(`${filename}${fileAppend}`)
          if (this.sendService.hasMessageOrFile()) {
            state = State.ASK_FOR_ACK
            reply =
              'Would you like to ask the recipients for an acknowledgement?'
            messagemeta = ButtonHelper.makeYesNoButton()
          } else {
            reply =
              'Great! Now type a message or upload the file (by clicking on the "+" sign) that you want to broadcast.'
            state = State.CREATE_MESSAGE
          }
        }
      } else {
        reply =
          'If you would like to upload a User File to send to please upload a .txt file with a return-separated list of users in your network'
        state = this.state
      }
    } else if (
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
      if (this.sendService.hasMessageOrFile()) {
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
