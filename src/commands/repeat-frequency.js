import State from '../state'

class RepeatFrequency {
  constructor({ repeatService, messageService }) {
    this.repeatService = repeatService
    this.messageService = messageService
    this.state = State.REPEAT_FREQUENCY
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
    // TODO more checks required
    if (this.messageService.isInt()) {
      this.repeatService.setFrequency(this.messageService.getMessage())
      this.repeatService.repeatMessage()
      reply = 'Broadcast message #1 in the process of being sent...'
      state = State.NONE
    } else {
      reply = 'Invalid Input, please enter a number value.'
      state = State.TIMES_REPEAT
    }
    return {
      reply,
      state,
    }
  }
}

export default RepeatFrequency
