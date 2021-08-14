import State from '../state'

class TimesRepeat {
  constructor({ combinedService, messageService }) {
    this.combinedService = combinedService
    this.messageService = messageService
    this.state = State.TIMES_REPEAT
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    let state
    let reply
    const message = this.messageService.getMessage()
    if (this.messageService.isInt() && parseInt(message, 10) > 0) {
      this.combinedService.setRepeats(parseInt(message, 10))
      reply =
        'How often would you like to repeat this message?(every 5, 10 or 15 minutes)'
      state = State.REPEAT_FREQUENCY
    } else {
      reply = 'Invalid Input, please enter a number value greater than 0.'
      state = this.state
    }
    return {
      reply,
      state,
    }
  }
}

export default TimesRepeat
