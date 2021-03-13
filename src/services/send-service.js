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
    this.messageService.user = messageService.user
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
      // TODO fix this.messageService.user.!! gracefully >:)
      logger.error(err)
      return null
    }
  }

  setFile(file) {
    this.messageService.user.file = file
  }

  setSendFile(file) {
    this.messageService.user.sendfile = file
  }

  getSendFile() {
    return this.messageService.user.sendfile
  }

  setMessage(message) {
    this.messageService.user.message = message
  }

  setDisplay(display) {
    console.log('send-service:setDisplay: '+display)
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

  setAckFlag(ackFlag) {
    console.log('send-service:setAckFlag: '+ackFlag)
    this.messageService.user.ackFlag = ackFlag
  }

  sendToFile() {

    const fileName = this.messageService.user.sendfile
    const sentBy = `\n\nBroadcast message sent by: ${this.messageService.user.userEmail}`
    let messageToSend = this.messageService.user.message + sentBy

    const flags=[]
    let buttons;
    if (this.messageService.user.ackFlag) {
      messageToSend = messageToSend + '\n\nPlease acknowledge message by replying with /ack'

      const button1 = {
        type: 'message',
        text: '/Ack',
        message: '/ack',
      };
      const button2 = {
        type: 'getlocation',
        text: '/Ack with Location',
      };
      buttons = [button1, button2];
    } else {
      buttons = [];
    }

    logger.debug('Broadcasting to a file: file='+fileName)
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
        file: this.messageService.user.sendfile,
        display: this.messageService.user.display,
      })
      apiService.writeMessageIDDB(
        messageID,
        this.messageService.user.userEmail,
        filePath,
        jsonDateTime,
        this.messageService.user.display
      )
      if (fileName.endsWith('hash')) {
        uMessage = apiService.sendAttachmentUserHashFileButtons(
          filePath,
          this.messageService.user.file,
          this.messageService.user.display,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          buttons
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendAttachmentUserNameFileButtons(
          filePath,
          this.messageService.user.file,
          this.messageService.user.display,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          buttons
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
        uMessage = apiService.sendMessageUserHashFileButtons(
          filePath,
          messageToSend,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          flags,
          buttons
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendMessageUserNameFileButtons(
          filePath,
          messageToSend,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          flags,
          buttons
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
    this.messageService.user.sendfile = ''
    this.messageService.user.message = ''
    this.messageService.user.userEmail = ''
    this.messageService.user.display = ''
    this.messageService.user.vGroupID = ''
    this.messageService.user.ttl = ''
    this.messageService.user.bor = ''
    this.messageService.user.ackFlag = 0
  }

  // This function is used to send a file to a room.
  retrieveFile(filePath, vGroupID) {
    apiService.sendRoomAttachment(vGroupID, filePath, filePath)
  }
}

export default SendService
