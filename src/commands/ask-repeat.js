import State from '../state'

class AskRepeat {
  constructor({ repeatService, broadcastService, messageService }) {
    this.repeatService = repeatService
    this.broadcastService = broadcastService
    this.messageService = messageService
    this.state = State.ASK_REPEAT
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
      if (this.repeatService.getActiveRepeat()) {
        reply =
          'There is already a repeating broadcast active, would you like to cancel it?'
        state = State.ACTIVE_REPEAT
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
            },
          ],
        }
      } else {
        this.repeatService.setActiveRepeat(true)
        reply = 'How many times would you like to repeat this message?'
        state = State.TIMES_REPEAT
      }
    } else if (this.messageService.negativeReply()) {
      this.repeatService.setActiveRepeat(false)

      // CHECK QUEUE here
      const broadcastsInQueue = 0
      if (broadcastsInQueue > 0) {
        reply = `There are ${broadcastsInQueue} broadcasts before you in the queue. Please confirm you are ready to send your broadcast.`
        state = State.CHECK_QUEUE
      }
      reply = this.broadcastService.broadcastMessage().pending // pending?? what this
      // TODO fix this! ? whats the issue
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
          },
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

export default AskRepeat
