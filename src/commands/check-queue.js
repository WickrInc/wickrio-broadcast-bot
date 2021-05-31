import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class CheckQueue {
  constructor({ broadcastService, messageService, apiService }) {
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.apiService = apiService
    this.state = State.CHECK_QUEUE
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
    let state
    let reply
    let messagemeta = {}
    if (this.messageService.affirmativeReply()) {
      reply = 'Would you like to ask the recipients for an acknowledgement?'
      messagemeta = ButtonHelper.makeYesNoButton()
      state = State.ASK_FOR_ACK
    } else if (this.messageService.negativeReply()) {
      // TODO now what?
      state = State.NONE
    } else {
      reply =
        'Invalid input, please reply with (y)es or (n)o or type /cancel to cancel previous flow'
      state = State.CHECK_QUEUE
      messagemeta = ButtonHelper.makeYesNoButton()
      return {
        reply,
        state,
        messagemeta,
      }
    }
  }
}

export default CheckQueue
