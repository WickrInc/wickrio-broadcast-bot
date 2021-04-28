import State from '../state'
import ButtonHelper from '../helpers/button-helper'
// import { logger } from '../helpers/constants'

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

    let messagemeta
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
      // TODO get rid of newline on last line
      // TODO add more function to listing files as well
      let replyStart =
        'Here are the saved user files that you can send a message to:\n'
      let index = 0
      for (index = 0; index < fileArr.length; index += 1) {
        replyStart += `(${index + 1}) ${fileArr[index]}\n`
      }
      reply = `${replyStart}To which list would you like to send your message?`
      const tableName = 'Show User Files'
      const firstColName = 'User Files'
      const actionColName = 'Select'
      // const entriesString = JSON.stringify(fileArr)
      messagemeta = ButtonHelper.makeButtonList(
        tableName,
        firstColName,
        actionColName,
        0,
        replyStart.length - 1,
        fileArr
      )
      state = State.CHOOSE_FILE
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = InitializeSend
