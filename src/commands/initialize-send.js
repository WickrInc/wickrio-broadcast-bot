import { bot } from '../helpers/constants'
import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class InitializeSend {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.commandString = '/send'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    const { message, userEmail, vGroupID } = this.messageService

    let messagemeta = {}
    let message2send
    if (message) {
      const parsedData = message.match(/(\/[a-zA-Z]+)([\s\S]*)$/)

      if (parsedData !== null) {
        if (parsedData[2] !== '') {
          message2send = parsedData[2]
          message2send = message2send.trim()
        }
      }
    }

    this.sendService.setMessage(message2send)
    this.sendService.setUserEmail(userEmail)
    this.sendService.setVGroupID(vGroupID)
    this.sendService.setTTL('')
    this.sendService.setBOR('')
    // this.broadcastService.setSentByFlag(true);
    const fileArr = this.sendService.getFiles(userEmail)
    // TODO add more command to getting files
    let reply
    let state = State.NONE
    if (!message2send) {
      reply = 'Must have a message or file to send, Usage: /send <message>'
    } else if (!fileArr || fileArr.length === 0) {
      reply =
        "There aren't any files available for sending, please upload a file of usernames or hashes first."
    } else {
      const transmitQueueInfo = bot.getTransmitQueueInfo()
      const broadcastsInQueue = transmitQueueInfo?.count
      if (broadcastsInQueue > 0) {
        reply = `There are ${broadcastsInQueue} broadcasts before you in the queue. Please confirm you are ready to send your broadcast.`
        state = State.CHECK_QUEUE_SEND
        messagemeta = ButtonHelper.makeYesNoButton()
      } else {
        reply =
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

        state = State.CHOOSE_FILE
      }
    }

    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = InitializeSend
