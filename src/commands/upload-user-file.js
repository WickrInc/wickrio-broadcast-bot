import State from '../state'
// import ButtonHelper from '../helpers/button-helper.js'
import FileHandler from '../helpers/file-handler'

class UploadUserFile {
  constructor({ fileService, combinedService, messageService }) {
    this.fileService = fileService
    this.combinedService = combinedService
    this.messageService = messageService
    this.state = State.UPLOAD_USER_FILE
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    const file = this.messageService.getFile()
    let reply = ''
    let state
    let messagemeta
    if (!file) {
      reply =
        'Please upload a .txt file with the list of usernames in line-separated format, only one username per line.'
      state = this.state
    } else {
      const filePath = this.messageService.getFilePath()
      const fileName = this.messageService.getFilename()
      const userEmail = this.messageService.getUserEmail()
      const fileArr = this.combinedService.getFiles(userEmail)
      this.fileService.setFilePath(filePath)
      this.fileService.setFilename(fileName)
      const checkFileObject = FileHandler.checkFileUpload(
        this.fileService,
        fileName,
        filePath,
        fileArr,
        '.user',
        userEmail
      )
      reply = checkFileObject.reply
      state = checkFileObject.state
      messagemeta = checkFileObject.messagemeta
      const retVal = checkFileObject.retVal
      if (!retVal) {
        state = this.state
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = UploadUserFile
