import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class AskForAck {
  constructor({ broadcastService, messageService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.ASK_FOR_ACK
  }

  shouldExecute() {
    const commandStatusMatches = this.messageService.matchUserCommandCurrentState(
      {
        commandState: this.state,
      }
    )
    return commandStatusMatches
  }

  execute() {
    let state = State.ASK_DM_RECIPIENT
    let reply =
      'If your broadcast requires a response, type in the username of the Wickr user to whom you want to direct these responses. Else type or click "Next" to move on to selecting the recipients of your message.'
    let messagemeta = ButtonHelper.makeCancelButtons(['Next'])

    if (this.messageService.affirmativeReply()) {
      this.broadcastService.setAckFlag(true)
    } else if (this.messageService.negativeReply()) {
      this.broadcastService.setAckFlag(false)
    } else {
      reply =
        'Invalid input, please reply with (y)es or (n)o or type /cancel to cancel previous flow'
      state = State.ASK_FOR_ACK
      messagemeta = ButtonHelper.makeYesNoButton()
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default AskForAck
