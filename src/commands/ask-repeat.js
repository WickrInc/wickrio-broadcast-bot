import State from '../state'
import ButtonHelper from '../helpers/button-helper.js'
import WickrIOBotAPI from 'wickrio-bot-api'
const bot = new WickrIOBotAPI.WickrIOBot()

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
        messagemeta = ButtonHelper.makeYesNoButton()
      } else {
        this.repeatService.setActiveRepeat(true)
        reply = 'How many times would you like to repeat this message?'
        state = State.TIMES_REPEAT
      }
    } else if (this.messageService.negativeReply()) {
      this.repeatService.setActiveRepeat(false)

      const txQInfo = bot.getTransmitQueueInfo()
      const broadcastsInQueue = txQInfo.count
      const broadcastDelay = txQInfo.estimated_time
      if (broadcastsInQueue > 0) {
        reply = `There are ${broadcastsInQueue} messages before you in the queue. This may add a delay of approximately ${broadcastDelay} mins to your broadcast.`
      } else {
        reply = this.broadcastService.broadcastMessage().pending
      }
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
