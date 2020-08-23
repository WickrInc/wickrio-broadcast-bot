import State from '../state'

class AskRepeat {
  constructor({ repeatService, broadcastService, messageService }) {
    this.repeatService = repeatService
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.ASK_REPEAT
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
    if (this.messageService.affirmativeReply()) {
      if (this.repeatService.getActiveRepeat()) {
        reply =
          'There is already a repeating broadcast active, would you like to cancel it?'
        state = State.ACTIVE_REPEAT
      } else {
        this.repeatService.setActiveRepeat(true)
        reply = 'How many times would you like to repeat this message?'
        state = State.TIMES_REPEAT
      }
    } else if (this.messageService.negativeReply()) {
      this.repeatService.setActiveRepeat(false)
      reply = this.broadcastService.broadcastMessage().pending
      // TODO fix this!
      state = State.NONE
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
      state = State.ASK_REPEAT
    }
    return {
      reply,
      state,
    }
  }
}

export default AskRepeat
