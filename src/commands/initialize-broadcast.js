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
    const {
      argument,
      // message,
      userEmail,
      vGroupID,
    } = this.messageService
    this.broadcastService.setMessage(argument)
    this.broadcastService.setUserEmail(userEmail)
    this.broadcastService.setVGroupID(vGroupID)
    this.broadcastService.setTTL('')
    this.broadcastService.setBOR('')
    this.broadcastService.setSentByFlag(true)
    let state = State.ASK_FOR_ACK
    let reply = 'Would you like to ask the recipients for an acknowledgement?'
    // TODO check for undefined??
    if (!argument) {
      reply =
        'Must have a message or file to broadcast, Usage: /broadcast <message>'
      state = State.NONE
    }
    return {
      reply,
      state,
    }
  }
}

export default InitializeBroadcast
