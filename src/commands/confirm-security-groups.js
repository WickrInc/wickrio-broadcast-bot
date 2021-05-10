import State from '../state'

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
      reply = 'Would you like to repeat this broadcast message?'
      state = State.ASK_REPEAT
      messagemeta = {
        buttons: [
          {
            type: 'message',
            text: 'yes',
            message: 'yes',
          },
          {
            type: 'message',
            text: 'no',
            message: 'no',
          }
        ],
      }
    } else if (this.messageService.negativeReply()) {
      reply =
        'Please enter the number(s) of the security group(s) or reply all to send the message to everyone in the network.'
      state = State.WHICH_GROUPS
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
      state = this.state
      messagemeta = {
        buttons: [
          {
            type: 'message',
            text: 'yes',
            message: 'yes',
          },
          {
            type: 'message',
            text: 'no',
            message: 'no',
          }
        ],
      }
    }

    const obj = {
      reply,
      state,
      messagemeta,
    }
    return obj
  }
}

export default ConfirmSecurityGroups
