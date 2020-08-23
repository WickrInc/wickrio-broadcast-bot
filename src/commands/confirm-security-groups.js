import State from '../state'

class ConfirmSecurityGroups {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.CONFIRM_GROUPS
  }

  shouldExecute() {
    if (this.messageService.getCurrentState() === this.state) {
      return true
    }
    return false
  }

  execute() {
    let state
    let reply
    // TODO account for voice/ file message
    if (this.messageService.affirmativeReply()) {
      reply = 'Would you like to repeat this broadcast message?'
      state = State.ASK_REPEAT
    } else if (this.messageService.negativeReply()) {
      reply =
        'Please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.'
      state = State.WHICH_GROUPS
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
      state = this.state
    }
    const obj = {
      reply,
      state,
    }
    return obj
  }
}

export default ConfirmSecurityGroups
