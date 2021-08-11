import { BROADCAST_ENABLED } from '../helpers/constants'
import State from '../state'
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
    const messagemeta = {}
    let state
    if (BROADCAST_ENABLED?.value === 'no') {
      reply = 'Broadcast is disabled, try the /start command to send to a file'
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
        reply = this.broadcastService.getSecurityGroupReply()
        state = State.WHICH_GROUPS
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
