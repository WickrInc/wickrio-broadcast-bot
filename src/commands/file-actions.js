import State from '../state'
import ButtonHelper from '../helpers/button-helper'
// import logger from '../logger'
import FileHandler from '../helpers/file-handler'

import { BROADCAST_ENABLED } from '../helpers/constants'

class FileActions {
  constructor({ fileService, broadcastService, sendService, messageService }) {
    this.fileService = fileService
    this.broadcastService = broadcastService
    this.sendService = sendService
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
    const fileArr = this.sendService.getFiles(userEmail)
    let fileAppend = ''
    let state = State.NONE
    let reply = ''
    let messagemeta = {}
    if (type === 'u' || type === 'user') {
      fileAppend = '.user'
    } else if (type === 'HASH') {
      fileAppend = '.hash'
    } else if (type === 's' || type === 'send') {
      // TODO should this be null
      this.sendService.setMessage(this.messageService.message)
      this.sendService.setupFileSend(filePath, filename, userEmail, vGroupID)
      const filesObject = this.sendService.getFilesForSending(userEmail)
      reply = filesObject.reply
      messagemeta = filesObject.messagemeta
      state = State.CHOOSE_FILE
    } else if (
      (type === 'b' || type === 'broadcast') &&
      (BROADCAST_ENABLED === 'undefined' || BROADCAST_ENABLED.value === 'yes')
    ) {
      this.broadcastService.setupFileBroadcast(
        filePath,
        filename,
        userEmail,
        vGroupID
      )
      // TODO should this be null
      this.broadcastService.setMessage(this.messageService.message)
      reply = 'Would you like to ask the recipients for an acknowledgement?'
      messagemeta = ButtonHelper.makeYesNoButton()
      state = State.ASK_FOR_ACK
    } else {
      const broadcastString =
        BROADCAST_ENABLED?.value === 'no' ? '' : '(b)roadcast, '
      reply = `Input not recognized, please reply with ${broadcastString}(s)end or (u)ser`
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
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default FileActions
