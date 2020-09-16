import { existsSync, mkdirSync } from 'fs'
import FileHandler from '../helpers/file-handler'
import StatusService from './status-service'
// TODO proper form??
import updateLastID from '../helpers/message-id-helper'
import { logger, apiService } from '../helpers/constants'

// TODO make fs a variable that is passed into the constructor
if (!existsSync(`${process.cwd()}/files`)) {
  mkdirSync(`${process.cwd()}/files`)
}

const dir = `${process.cwd()}/files`

class SendService {
  constructor({ messageService }) {
    this.messageService = messageService
  }

  // TODO what happens if someone is adding a file at the same time as someone is sending a message?
  getFiles(userEmail) {
    try {
      this.messageService.user.userDir = `${dir}/${userEmail}/`
      this.messageService.user.fileArr = FileHandler.listFiles(
        this.messageService.user.userDir
      )
      return this.messageService.user.fileArr
    } catch (err) {
      // TODO fix this.user.!! gracefully >:)
      logger.error(err)
      return null
    }
  }

  setFile(file) {
    this.messageService.user.file = file
  }

  setMessage(message) {
    this.messageService.user.message = message
  }

  setDisplay(display) {
    this.messageService.user.display = display
  }

  setUserEmail(email) {
    this.messageService.user.userEmail = email
  }

  setVGroupID(vGroupID) {
    this.messageService.user.vGroupID = vGroupID
  }

  setBOR(bor) {
    this.messageService.user.bor = bor
  }

  setTTL(ttl) {
    this.messageService.user.ttl = ttl
  }

  sendToFile(fileName) {
    const sentBy = `\n\nBroadcast message sent by: ${this.messageService.user.userEmail}`
    const messageToSend = this.messageService.user.message + sentBy
    logger.debug('Broadcasting to a file')
    const currentDate = new Date()
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON()
    // TODO move filePathcreation?
    const filePath = this.messageService.user.userDir + `${fileName}`
    let uMessage
    const messageID = updateLastID()
    if (
      this.messageService.user.file !== undefined &&
      this.messageService.user.file !== ''
    ) {
      console.log({
        messageID,
        email: this.messageService.user.userEmail,
        filePath,
        jsonDateTime,
        disaply: this.messageService.user.display,
      })
      apiService.writeMessageIDDB(
        messageID,
        this.messageService.user.userEmail,
        filePath,
        jsonDateTime,
        this.messageService.user.display
      )
      if (fileName.endsWith('hash')) {
        uMessage = apiService.sendAttachmentUserHashFile(
          filePath,
          this.messageService.user.file,
          this.messageService.user.display,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendAttachmentUserNameFile(
          filePath,
          this.messageService.user.file,
          this.messageService.user.display,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID
        )
      }
    } else {
      console.log({
        messageID,
        email: this.messageService.user.userEmail,
        filePath,
        jsonDateTime,
        message: this.messageService.user.message,
      })
      apiService.writeMessageIDDB(
        messageID,
        this.messageService.user.userEmail,
        filePath,
        jsonDateTime,
        this.messageService.user.message
      )
      if (fileName.endsWith('hash')) {
        uMessage = apiService.sendMessageUserHashFile(
          filePath,
          messageToSend,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendMessageUserNameFile(
          filePath,
          messageToSend,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID
        )
      }
    }
    if (
      this.messageService.user.vGroupID !== '' &&
      this.messageService.user.vGroupID !== undefined
    ) {
      StatusService.asyncStatus(messageID, this.messageService.user.vGroupID)
    }
    this.clearValues()
    logger.debug(`Broadcast uMessage${uMessage}`)
  }

  clearValues() {
    this.messageService.user.file = ''
    this.messageService.user.message = ''
    this.messageService.user.userEmail = ''
    this.messageService.user.display = ''
    this.messageService.user.vGroupID = ''
    this.messageService.user.ttl = ''
    this.messageService.user.bor = ''
  }

  // This function is used to send a file to a room.
  retrieveFile(filePath, vGroupID) {
    apiService.sendRoomAttachment(vGroupID, filePath, filePath)
  }
}

export default SendService
