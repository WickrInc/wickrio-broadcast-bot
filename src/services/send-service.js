import { existsSync, mkdirSync } from 'fs'
import FileHandler from '../helpers/file-handler'
import StatusService from './status-service'
// TODO proper form??
import updateLastID from '../helpers/message-id-helper'
import { logger, apiService } from '../helpers/constants'
import ButtonHelper from '../helpers/button-helper'

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
    console.log('send-service:setDisplay: ' + display)
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
    console.log('send-service:setAckFlag: ' + ackFlag)
    this.messageService.user.ackFlag = ackFlag
  }

  getFilesForSending(userEmail) {
    const fileArr = this.getFiles(userEmail)
    let messagemeta
    let reply =
      'Here are the saved user files that you can send a message to:\n'
    const basereplylength = reply.length

    messagemeta = {
      table: {
        name: 'List of files',
        firstcolname: 'Name',
        secondcolname: 'Type',
        actioncolname: 'Select',
        rows: [],
      },
    }
    const length = fileArr.length

    for (let index = 0; index < length; index += 1) {
      let fileName = fileArr[index]
      let fileType
      if (fileName.endsWith('.user')) {
        fileType = 'User file'
        fileName = fileName.slice(0, -5)
      } else if (fileName.endsWith('.hash')) {
        fileType = 'Hash file'
        fileName = fileName.slice(0, -5)
      }
      reply += `(${index + 1}) ${fileName}\n`

      const response = index + 1
      const row = {
        firstcolvalue: fileName,
        secondcolvalue: fileType,
        response: response.toString(),
      }
      messagemeta.table.rows.push(row)
    }

    reply += `To which list would you like to send your message?`

    // Add the area of text to cut for clients that handle lists
    messagemeta.textcut = [
      {
        startindex: basereplylength - 1,
        endindex: reply.length,
      },
    ]

    // messagemeta = ButtonHelper.makeButtonList(
    //   'List of files',
    //   'Name',
    //   'Select',
    //   basereplylength - 1,
    //   reply.length,
    //   rows
    // )
    return {
      reply,
      messagemeta,
    }
  }

  sendToFile() {
    const fileName = this.messageService.user.sendfile
    const sentBy = `\n\nBroadcast message sent by: ${this.messageService.user.userEmail}`
    let messageToSend = this.messageService.user.message + sentBy

    const flags = []
    let meta = {}
    if (this.messageService.user.ackFlag) {
      messageToSend =
        messageToSend + '\n\nPlease acknowledge message by replying with /ack'

      const button1 = {
        type: 'message',
        text: '/Ack',
        message: '/ack',
      }
      const button2 = {
        type: 'getlocation',
        text: '/Ack with Location',
      }
      meta = {
        buttons: [button1, button2],
      }
    } else {
      meta = {
        buttons: [],
      }
    }
    const metaString = JSON.stringify(meta)

    logger.debug('Broadcasting to a file: file=' + fileName)
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
        uMessage = apiService.sendAttachmentUserHashFile(
          filePath,
          this.messageService.user.file,
          this.messageService.user.display,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          metaString
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendAttachmentUserNameFile(
          filePath,
          this.messageService.user.file,
          this.messageService.user.display,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          metaString
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
          messageID,
          flags,
          metaString
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendMessageUserNameFile(
          filePath,
          messageToSend,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          flags,
          metaString
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

module.exports = SendService
