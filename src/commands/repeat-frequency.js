import State from '../state'
import WickrIOBotAPI from 'wickrio-bot-api'
const bot = new WickrIOBotAPI.WickrIOBot()

class RepeatFrequency {
  constructor({ repeatService, combinedService, messageService }) {
    this.repeatService = repeatService
    this.combinedService = combinedService
    this.messageService = messageService
    this.state = State.REPEAT_FREQUENCY
  }

  shouldExecute() {
    return this.messageService.matchUserCommandCurrentState({
      commandState: this.state,
    })
  }

  async execute() {
    let state
    let reply
    // TODO more checks required
    const message = this.messageService.message
    if (
      this.messageService.isInt() &&
      (message === '5' || message === '10' || message === '15')
    ) {
      this.combinedService.setFrequency(message)
      await this.repeatService.repeatMessage()
      // Check the queue and send info message if pending broadcasts
      // TODO use the queueInfo in combined service
      const txQInfo = await bot.getTransmitQueueInfo()
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
      reply = 'Invalid Input, please enter a number value of 5, 10, or 15'
      state = this.state
    }
    return {
      reply,
      state,
    }
  }
}

export default RepeatFrequency
