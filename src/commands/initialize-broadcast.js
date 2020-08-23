import State from '../state'
import { logger } from '../helpers/constants'

class InitializeBroadcast {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.commandString = '/broadcast'
  }

  shouldExecute() {
    if (this.messageService.getCommand() === this.commandString) {
      return true
    }
    return false
  }

  execute() {
    this.broadcastService.setMessage(this.messageService.getArgument())
    this.broadcastService.setUserEmail(this.messageService.getUserEmail())
    this.broadcastService.setVGroupID(this.messageService.getVGroupID())
    this.broadcastService.setTTL('')
    this.broadcastService.setBOR('')
    this.broadcastService.setSentByFlag(true)
    logger.debug(
      `Here are all the things: ${this.messageService.getArgument()}`
    )
    let reply = 'Would you like to ask the recipients for an acknowledgement?'
    let state = State.ASK_FOR_ACK
    // TODO check for undefined??
    if (
      this.messageService.getArgument() === undefined ||
      this.messageService.getArgument() === '' ||
      this.messageService.getArgument().length === 0
    ) {
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
