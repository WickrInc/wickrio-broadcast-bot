import State from '../state'

class TimesRepeat {
  constructor({ repeatService, messageService }) {
    this.repeatService = repeatService
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
    const { vGroupID } = this.messageService
    if (this.messageService.isInt()) {
      this.repeatService.setRepeats(
        parseInt(this.messageService.getMessage(), 10)
      )
      this.repeatService.setVGroupID(vGroupID)
      console.log(vGroupID)
      reply =
        'How often would you like to repeat this message?(every 5, 10 or 15 minutes)'
      state = State.REPEAT_FREQUENCY
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

export default TimesRepeat
