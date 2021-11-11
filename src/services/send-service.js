import { existsSync, mkdirSync } from 'fs'

import FileHandler from '../helpers/file-handler'
import StatusService from './status-service'
import updateLastID from '../helpers/message-id-helper'
import { logger, apiService } from '../helpers/constants'
import WickrIOBotAPI from 'wickrio-bot-api'
import ButtonHelper from '../helpers/button-helper'
const bot = new WickrIOBotAPI.WickrIOBot()

// TODO make fs a variable that is passed into the constructor
if (!existsSync(`${process.cwd()}/files`)) {
  mkdirSync(`${process.cwd()}/files`)
}

// TODO reduce magic chars
const dir = `${process.cwd()}/files`

class SendService {
  constructor({ messageService }) {
    this.messageService = messageService
    // TODO replace with just this.user
    this.messageService.user = messageService.user
    this.messageService.user.ttl = ''
    this.messageService.user.bor = ''
  }

  // TODO what happens if someone is adding a file at the same time as someone is sending a message?
  getFiles(userEmail) {
    try {
      const userDir = `${dir}/${userEmail}/`
      return FileHandler.listFiles(userDir)
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
    logger.verbose('send-service:setDisplay: ' + display)
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
    logger.verbose('send-service:setAckFlag: ' + ackFlag)
    this.messageService.user.ackFlag = ackFlag
  }

  setDMFlag(dmFlag) {
    this.messageService.user.dmFlag = dmFlag
  }

  setDMRecipient(dmRecipient) {
    this.messageService.user.dmRecipient = dmRecipient
  }

  getMessage() {
    return this.messageService.user.message
  }

  setupFileSend(filePath, filename, userEmail, vGroupID) {
    this.setFile(filePath)
    this.setDisplay(filename)
    this.setUserEmail(userEmail)
    this.setVGroupID(vGroupID)
    this.setTTL('')
    this.setBOR('')
  }

  getQueueInfo() {
    const txQInfo = bot.getTransmitQueueInfo()
    const broadcastsInQueue = txQInfo.tx_queue.length
    let broadcastDelay = txQInfo.estimated_time
    broadcastDelay = broadcastDelay + 30
    broadcastDelay = Math.round(broadcastDelay / 60)
    if (broadcastsInQueue > 0) {
      return `There are ${broadcastsInQueue} broadcasts before you in the queue. This may add a delay of approximately ${broadcastDelay} minutes to your broadcast.`
    }
    return `Message sent to users from the file: ` + this.getSendFile()
  }

  getFilesForSending(userEmail) {
    const fileArr = this.getFiles(userEmail)
    let reply = ''
    let messagemeta = {}
    // TODO check button list cut on iOS
    if (!fileArr || fileArr.length === 0) {
      reply =
        "There aren't any files available for sending, please upload a file of usernames first."
    } else {
      reply = 'Here are the saved user files to which you can send a message:\n'
      const baseReplyLength = reply.length
      const files = fileArr.map(file => file.slice(0, -5))
      for (let index = 0; index < files.length; index += 1) {
        reply += `(${index + 1}) ${files[index]}\n`
      }
      reply += `To which list would you like to send your message?`
      messagemeta = ButtonHelper.makeButtonList(
        'List of files',
        'Name',
        'Select',
        baseReplyLength,
        reply.length,
        files
      )
    }
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
    if (this.messageService.user.ackFlag) {
      messageToSend = `${messageToSend}\n\nPlease acknowledge message by replying with /ack`
    }
    if (this.messageService.user.dmFlag) {
      messageToSend = `${messageToSend}\n\nPlease send a response to ${this.messageService.user.dmRecipient}`
    }
    const metaString = ButtonHelper.makeRecipientButtons(
      this.messageService.user.ackFlag,
      this.messageService.user.dmFlag,
      this.messageService.user.dmRecipient
    )
    logger.debug('Broadcasting to a file: file=' + fileName)
    const currentDate = new Date()
    // "YYYY-MM-DDTHH:MM:SS.sssZ"
    const jsonDateTime = currentDate.toJSON()
    // TODO move filePathcreation?
    const userDir = `${dir}/${this.messageService.user.userEmail}/`
    const filePath = userDir + `${fileName}`
    let uMessage
    const messageID = updateLastID()
    if (
      this.messageService.user.file !== undefined &&
      this.messageService.user.file !== ''
    ) {
      logger.debug({
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
          metaString,
          sentBy
        )
      } else if (fileName.endsWith('user')) {
        uMessage = apiService.sendAttachmentUserNameFile(
          filePath,
          this.messageService.user.file,
          this.messageService.user.display,
          this.messageService.user.ttl,
          this.messageService.user.bor,
          messageID,
          metaString,
          sentBy
        )
      }
    } else {
      logger.debug({
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
    this.messageService.user.dmFlag = false
    this.messageService.user.dmRecipient = ''
  }

  // This function is used to send a file to a room.
  retrieveFile(filePath, vGroupID) {
    apiService.sendRoomAttachment(vGroupID, filePath, filePath)
  }
}

module.exports = SendService
