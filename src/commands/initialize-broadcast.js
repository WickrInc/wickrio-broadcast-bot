import { BROADCAST_ENABLED } from '../helpers/constants'
import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'
// import { logger } from '../helpers/constants'

class InitializeBroadcast {
  constructor({ broadcastService, messageService, apiService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.apiService = apiService
    this.commandString = '/broadcast'
  }

  shouldExecute() {
    if (this.messageService.command === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    let reply
    let messagemeta = {}
    let state
    if (BROADCAST_ENABLED?.value === 'no') {
      reply = 'Broadcast is disabled, try the /send command to send to a file'
      state = State.NONE
    } else {
      const { message, userEmail, vGroupID } = this.messageService

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

      this.broadcastService.setMessage(message2send)
      this.broadcastService.setUserEmail(userEmail)
      this.broadcastService.setVGroupID(vGroupID)
      this.broadcastService.setSentByFlag(true)
      // TODO check for undefined??
      if (message2send) {
        reply = 'Would you like to ask the recipients for an acknowledgement?'
        messagemeta = ButtonHelper.makeYesNoButton()
        state = State.ASK_FOR_ACK
      } else {
        reply =
          'Must have a message or file to broadcast, Usage: /broadcast <message>'
        state = State.NONE
      }
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

module.exports = InitializeBroadcast
