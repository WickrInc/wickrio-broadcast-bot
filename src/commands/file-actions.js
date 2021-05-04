import State from '../state'
// import logger from '../logger'
import FileHandler from '../helpers/file-handler'

import { BROADCAST_ENABLED, FILE_ENTRY_SIZE } from '../helpers/constants'

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
    const filePath = this.fileService.getFilePath()
    const filename = this.fileService.getFilename()
    // console.log('file actions file service')
    const type = this.messageService.getMessage().toLowerCase()
    const userEmail = this.messageService.getUserEmail()
    const fileArr = this.sendService.getFiles(userEmail)
    console.log('Question ' + BROADCAST_ENABLED?.value === 'no')
    let fileAppend = ''
    let state = State.NONE
    let reply = ''
    if (type === 'u' || type === 'user') {
      fileAppend = '.user'
    } else if (type === 'h' || type === 'hash') {
      fileAppend = '.hash'
    } else if (type === 's' || type === 'send') {
      this.sendService.setFile(filePath) // set this service to setFilePath?
      this.sendService.setDisplay(filename)
      // TODO should this be null
      this.sendService.setMessage(this.messageService.message)
      this.sendService.setUserEmail(this.messageService.userEmail)
      this.sendService.setVGroupID(this.messageService.vGroupID)
      this.sendService.setTTL('')
      this.sendService.setBOR('')
      if (!fileArr || fileArr.length === 0) {
        reply =
          "There aren't any files available for sending, please upload a file of usernames or hashes first."
      } else {
        reply = 'To which list would you like to send your message:\n'
        const length = Math.min(fileArr.length, 10)
        for (let index = 0; index < length; index += 1) {
          reply += `(${index + 1}) ${fileArr[index]}\n`
        }
        state = State.CHOOSE_FILE
      }
    } else if (
      (type === 'b' || type === 'broadcast') &&
      (BROADCAST_ENABLED === 'undefined' || BROADCAST_ENABLED.value === 'yes')
    ) {
      this.broadcastService.setFile(filePath)
      this.broadcastService.setDisplay(filename)
      this.broadcastService.setMessage(this.messageService.message)
      this.broadcastService.setUserEmail(this.messageService.userEmail)
      this.broadcastService.setVGroupID(this.messageService.vGroupID)
      this.broadcastService.setTTL('')
      this.broadcastService.setBOR('')
      this.broadcastService.setSentByFlag(true)
      reply = 'Would you like to ask the recipients for an acknowledgement?'
      state = State.ASK_FOR_ACK
    } else {
      const broadcastString =
        BROADCAST_ENABLED?.value === 'no' ? '' : '(b)roadcast, '
      reply = `Input not recognized, please reply with ${broadcastString}(s)end, (u)ser, or (h)ash`
      state = State.FILE_TYPE
    }
    if (fileAppend !== '') {
      // Make sure the file is not blank.
      if (FileHandler.checkFileBlank(filePath)) {
        reply = `File: ${filename} is empty. Please send a list of usernames or hashes`
        // If file already exists go to the overwrite check state
      } else if (FileHandler.checkFileSize(filePath)) {
        // TODO fix the maxentries
        reply = `This user file has more than ${FILE_ENTRY_SIZE.value} entries. Please reduce the number of entries and try uploading it again.`
      } else if (fileArr.includes(`${filename}${fileAppend}`)) {
        this.fileService.setOverwriteFileType(fileAppend)
        reply =
          'Warning : File already exists in user directory.\nIf you continue you will overwrite the file.\nReply (yes/no) to continue or cancel.'
        state = State.OVERWRITE_CHECK
        // Upload new file to the user directory
      } else if (fileAppend === '.user' || fileAppend === '.hash') {
        console.log('file actions user or hash, should copy file')
        const newFilePath = `${process.cwd()}/files/${userEmail}/${filename.toString()}${fileAppend}`
        console.log({
          filePath,
          newFilePath,
          userEmail,
          fileName: filename.toString(),
          fileAppend,
        })

        // logger.debug(`Here is file info${file}`)
        const cp = FileHandler.copyFile(filePath, newFilePath)
        // console.log({ cp })

        if (cp) {
          reply = `File named: ${filename} successfully saved to directory.`
        } else {
          reply = `Error: File named: ${filename} not saved to directory.`
        }
      }
    }
    return {
      reply,
      state,
    }
  }
}

export default FileActions
