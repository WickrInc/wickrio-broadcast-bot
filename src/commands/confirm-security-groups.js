import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class ConfirmSecurityGroups {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.CONFIRM_GROUPS
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    let state
    let reply
    let messagemeta = {}

    // TODO account for voice/ file message
    if (this.messageService.affirmativeReply()) {
      if (this.broadcastService.hasMessageOrFile()) {
        reply = 'Would you like to ask the recipients for an acknowledgement?'
        state = State.ASK_FOR_ACK
        messagemeta = ButtonHelper.makeYesNoButton(0)
      } else {
        reply =
          'Great! Now type a message or upload the file (by clicking on the "+" sign) that you want to broadcast.'
        state = State.CREATE_MESSAGE
      }
    } else if (this.messageService.negativeReply()) {
      reply = this.broadcastService.getSecurityGroupReply()
      // reply =
      //   'Please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.'
      state = State.WHICH_GROUPS
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
      state = this.state
      messagemeta = ButtonHelper.makeYesNoButton(0)
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default ConfirmSecurityGroups
