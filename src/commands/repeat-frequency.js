import State from '../state'
import WickrIOBotAPI from 'wickrio-bot-api'
const bot = new WickrIOBotAPI.WickrIOBot()

class RepeatFrequency {
  constructor({ repeatService, messageService }) {
    this.repeatService = repeatService
    this.messageService = messageService
    this.state = State.REPEAT_FREQUENCY
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  execute() {
    let state
    let reply
    // TODO more checks required
    const { vGroupID } = this.messageService
    this.repeatService.setVGroupID(vGroupID)
    if (this.messageService.isInt()) {
      this.repeatService.setFrequency(this.messageService.message)
      this.repeatService.repeatMessage()
      // Check the queue and send info message if pending broadcasts
      const txQInfo = bot.getTransmitQueueInfo()
      const broadcastsInQueue = txQInfo.tx_queue.length
      let broadcastDelay = txQInfo.estimated_time
      broadcastDelay = broadcastDelay + 30
      broadcastDelay = Math.round(broadcastDelay / 60)
      if (broadcastsInQueue > 0) {
        reply = `There are ${broadcastsInQueue} broadcasts before you in the queue. This may add a delay of approximately ${broadcastDelay} minutes to your broadcast.`
      } else {
        reply = 'Broadcast message #1 in the process of being sent...'
      }
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
