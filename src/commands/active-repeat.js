import State from '../state'

class ActiveRepeat {
  constructor({ repeatService, messageService }) {
    this.repeatService = repeatService
    this.messageService = messageService
    this.state = State.ACTIVE_REPEAT
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

    if (this.messageService.affirmativeReply()) {
      reply = 'How many times would you like to repeat this message?'
      state = State.TIMES_REPEAT
      this.repeatService.setActiveRepeat(false)
    } else if (this.messageService.negativeReply()) {
      // TODO what if they don't want to cancel?
      reply = 'Please send a new broadcast'
      state = State.NONE
    } else {
      reply = 'Invalid input, please reply with (y)es or (n)o'
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
    }
    return {
      reply,
      state,
      messagemeta,
    }
  }
}

export default ActiveRepeat
