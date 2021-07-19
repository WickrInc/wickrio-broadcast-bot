import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class SelectRecipients {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.SELECT_RECIPIENTS
  }

  // TODO should this be standard??
  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    let reply
    let state
    const messagemeta = {}
    const message = this.messageService.getMessage()
    if (
      (message.toLowerCase() === 'security group' ||
        message.toLowerCase() === 's') &&
      this.broadcastService.getBroadcastEnabled
    ) {
      reply = this.broadcastService.getSecurityGroupReply
    } else if (
      message.toLowerCase() === 'existing user file' ||
      message.toLowerCase() === 'e'
    )
      return {
        reply,
        state,
        messagemeta,
      }
  }
}

export default SelectRecipients
