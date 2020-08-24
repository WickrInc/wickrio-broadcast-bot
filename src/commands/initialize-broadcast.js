import State from '../state'
// import { logger } from '../helpers/constants'

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
    const {
      argument,
      message,
      userEmail,
      vGroupID,
    } = this.messageService.getMessageData()
    console.log({ argument, message })

    this.broadcastService.setMessage(argument)
    this.broadcastService.setUserEmail(userEmail)
    this.broadcastService.setVGroupID(vGroupID)
    this.broadcastService.setTTL('')
    this.broadcastService.setBOR('')
    this.broadcastService.setSentByFlag(true)
    this.messageService.setUserCurrentState({ currentState: State.ASK_FOR_ACK }) // change to broacastservice?

    console.log('initbroadcast')
    console.log(this.broadcastService)
    let reply = 'Would you like to ask the recipients for an acknowledgement?'
    // TODO check for undefined??
    if (!argument) {
      reply =
        'Must have a message or file to broadcast, Usage: /broadcast <message>'
      this.messageService.setUserCurrentState({ currentState: State.NONE })
    }
    return {
      reply,
      state: State.ASK_FOR_ACK,
    }
  }
}

export default InitializeBroadcast
