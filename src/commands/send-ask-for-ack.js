import State from '../state'
import ButtonHelper from '../helpers/button-helper'

class SendAskForAck {
  constructor({ sendService, messageService }) {
    this.sendService = sendService
    this.messageService = messageService
    this.state = State.SEND_ASK_FOR_ACK
  }

  shouldExecute() {
    // TODO could remove the /broadcast check if done right
    const commandStatusMatches = this.messageService.matchUserCommandCurrentState(
      {
        commandState: this.state,
      }
    )
    return commandStatusMatches
  }

  execute() {
    let state = State.SEND_ASK_DM_RECIPIENT
    let reply =
      'If your broadcast requires a response, type in the username of the Wickr user to whom you want to direct these responses. Else type or click "Complete" to move on to selecting the recipients of your message.'
    let messagemeta = ButtonHelper.makeCancelButtons(['Complete'])

    if (this.messageService.affirmativeReply()) {
      this.sendService.setAckFlag(true)
    } else if (this.messageService.negativeReply()) {
      this.sendService.setAckFlag(false)
    } else {
      reply =
        'Invalid input, please reply with (y)es or (n)o or type /cancel to cancel previous flow'
      state = State.SEND_ASK_FOR_ACK
      messagemeta = ButtonHelper.makeYesNoButton()
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default SendAskForAck
