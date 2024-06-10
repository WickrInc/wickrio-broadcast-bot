import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'

class AskRepeat {
  constructor({ combinedService, messageService }) {
    this.combinedService = combinedService
    this.messageService = messageService
    this.state = State.ASK_REPEAT
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  async execute() {
    let state
    let reply
    let messagemeta = {}

    if (this.messageService.affirmativeReply()) {
      if (this.combinedService.isActiveRepeat()) {
        reply =
          'There is already a repeating broadcast active, would you like to cancel it?'
        state = State.ACTIVE_REPEAT
        messagemeta = ButtonHelper.makeYesNoButton()
      } else {
        this.combinedService.setActiveRepeat(true)
        reply = 'How many times would you like to repeat this message?'
        state = State.TIMES_REPEAT
      }
    } else if (this.messageService.negativeReply()) {
      this.combinedService.setActiveRepeat(false)
      // Send the broadcast
      reply = await this.combinedService.broadcastMessage()
      state = State.NONE
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
      state = State.ASK_REPEAT
      messagemeta = ButtonHelper.makeYesNoButton()
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default AskRepeat
