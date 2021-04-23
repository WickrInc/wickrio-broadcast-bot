import { BROADCAST_ENABLED } from '../helpers/constants'
import State from '../state'
// import { logger } from '../helpers/constants'

class InitializeBroadcast {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
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
      this.broadcastService.setTTL('')
      this.broadcastService.setBOR('')
      this.broadcastService.setSentByFlag(true)
      state = State.ASK_FOR_ACK
      reply = 'Would you like to ask the recipients for an acknowledgement?'
      // TODO check for undefined??
      if (!message2send) {
        reply =
          'Must have a message or file to broadcast, Usage: /broadcast <message>'
        state = State.NONE
      }
    }
    return {
      reply,
      state,
    }
  }
}

module.exports = InitializeBroadcast
