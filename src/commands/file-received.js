import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

const path = require('path')
class FileReceived {
  constructor({ fileService, setupService, combinedService, messageService }) {
    this.fileService = fileService
    this.setupService = setupService
    this.messageService = messageService
    this.combinedService = combinedService
  }

  shouldExecute() {
    const file = this.messageService.getFile()
    console.log('TD' + this.messageService.getUserCurrentStateConstructor())
    const currentState = this.messageService.getUserCurrentStateConstructor()
    if (
      file &&
      // TODO make this more robust
      // !this.messageService.matchUserCommandCurrentState({
      //   commandState: State.UPLOAD_USER_FILE,
      // })
      (currentState === null || currentState === State.NONE)
    ) {
      return true
    }
    return false
  }

  execute() {
    const filePath = this.messageService.getFilePath()
    const fileName = this.messageService.getFilename()
    const userEmail = this.messageService.getUserEmail()
    const vGroupID = this.messageService.getVGroupID()
    this.fileService.setFilePath(filePath)
    this.fileService.setFilename(fileName)
    this.combinedService.clearValues()
    let reply
    let messagemeta
    let state
    if (path.extname(filePath) === '.txt') {
      reply =
        'Is this .txt file a User File (a list of return separated users in your network) to whom you want to broadcast a message?'
      messagemeta = ButtonHelper.makeYesNoButton()
      state = State.FILE_TYPE
      // reply = `Would you like to ${broadcastString}send this file to a list? Please respond with ${broadcastLetterString}(s)end or (u)ser`
    } else {
      const retObj = this.setupService.getStartReply(userEmail)
      reply = `${retObj.reply}\n\nIf you would like to upload a User File to send to please upload a .txt file with a return-separated list of users in your network`
      messagemeta = retObj.messagemeta
      state = State.SELECT_RECIPIENTS
      this.combinedService.setupFileBroadcast(
        filePath,
        fileName,
        userEmail,
        vGroupID
      )
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default FileReceived
