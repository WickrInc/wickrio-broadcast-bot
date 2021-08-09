import State from '../state'
// import logger from '../logger'
import FileHandler from '../helpers/file-handler'

class FileActions {
  constructor({ fileService, combinedService, setupService, messageService }) {
    this.fileService = fileService
    this.combinedService = combinedService
    this.setupService = setupService
    this.messageService = messageService
    this.state = State.FILE_TYPE
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    const type = this.messageService.getMessage().toLowerCase()
    const filePath = this.fileService.getFilePath()
    const filename = this.fileService.getFilename()
    const userEmail = this.messageService.getUserEmail()
    const vGroupID = this.messageService.getVGroupID()
    const fileArr = this.combinedService.getFiles(userEmail)
    let fileAppend = ''
    let state
    let reply = ''
    let messagemeta = {}
    this.combinedService.setUserEmail(userEmail)
    this.combinedService.setVGroupID(vGroupID)
    this.combinedService.setSentByFlag(true)
    if (type === 'HASH') {
      fileAppend = '.hash'
    } else if (this.messageService.affirmativeReply()) {
      state = State.CREATE_MESSAGE
      fileAppend = '.user'
    } else if (this.messageService.negativeReply()) {
      const retObj = this.setupService.getStartReply(userEmail)
      reply = retObj.reply
      messagemeta = retObj.messagemeta
      state = State.SELECT_RECIPIENTS
    } else {
      reply = 'Input not recognized, please reply with yes or no'
      state = State.FILE_TYPE
    }
    if (fileAppend !== '') {
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
        this.combinedService.setSendFile(filename)
        reply =
          'Great! Now type a message or upload the file (by clicking on the "+" sign) that you want to broadcast.'
        state = State.CREATE_MESSAGE
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default FileActions
